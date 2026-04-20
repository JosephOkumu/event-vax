require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const IntaSend = require('intasend-node');

// SQLite Integration
const db = require('./utils/ussd_db.cjs');
const { getEventsList, getEventMap } = require('./utils/ussd_eventService.cjs');

const app = express();

// Initialize SQLite tables
db.initUssdTables();

// Trust proxy for rate limiting (ngrok)
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => ipKeyGenerator(req, res),
});
app.use(limiter);

const intaSend = new IntaSend(
  process.env.INTASEND_PUBLIC_KEY,
  process.env.INTASEND_PRIVATE_KEY,
  process.env.INTASEND_ENV !== 'live' // true = sandbox
);

async function initiateStkPush(phoneNumber, amount, metadata = {}) {
  const collection = intaSend.collection();
  const payload = {
    amount,
    phone_number: phoneNumber,
    narrative: metadata.transactionDesc || 'Event Ticket',
    api_ref: metadata.accountRef || `ticket-${Date.now()}`,
    currency: 'KES',
  };

  const res = await collection.mpesaStkPush(payload);
  console.log('IntaSend STK response:', res);
  return res;
}

app.post('/ussd', async (req, res) => {
  try {
    const { phoneNumber, text = '' } = req.body;
    const steps = text ? text.split('*') : [];

    let response = '';

    if (!phoneNumber) {
      response = 'END Missing phone number';
    } else if (text === '') {
      response = `CON Welcome to AVARA
1. Buy Ticket
2. My Tickets
3. Wallet
4. Events Near Me
5. Support
0. Exit`;
    } else if (steps[0] === '1') {
      if (steps.length === 1) {
        const events = await getEventsList();

        if (events.length === 0) {
          response = 'END No events available at the moment.';
        } else {
          let menu = 'CON Select Event:\n';
          events.slice(0, 9).forEach((event, index) => {
            menu += `${index + 1}. ${event.name} (${event.price} KES)\n`;
          });
          menu += '0. Back';
          response = menu;
        }
      } else if (steps.length === 2) {
        if (steps[1] === '0') {
          response = `CON Welcome to AVARA
1. Buy Ticket
2. My Tickets
3. Wallet
4. Events Near Me
5. Support
0. Exit`;
        } else {
          const eventMap = await getEventMap();
          const event = eventMap[steps[1]];
          response = event
            ? `CON ${event.name}
Price: ${event.price} KES
1. Pay with M-Pesa
0. Cancel`
            : 'END Invalid option.';
        }
      } else if (steps.length === 3) {
        if (steps[2] === '0') {
          response = 'END Transaction cancelled.';
        } else if (steps[2] === '1') {
          const eventMap = await getEventMap();
          const event = eventMap[steps[1]];
          if (!event) {
            response = 'END Invalid option.';
          } else {
            try {
              await initiateStkPush(phoneNumber, event.price, {
                accountRef: event.name,
                transactionDesc: 'Event Ticket',
              });

              const ticketCode = Math.floor(10000 + Math.random() * 90000).toString();

              // Storage in SQLite
              db.createTicket({
                phoneNumber,
                eventId: event.id,
                eventName: event.name,
                price: event.price,
                ticketCode,
              });

              response = `END Payment initiated.
Your Ticket Code: ${ticketCode}`;
            } catch (err) {
              console.error('Failed to process payment:', err);
              response = 'END Payment failed. Try again.';
            }
          }
        } else {
          response = 'END Invalid option.';
        }
      } else {
        response = 'END Invalid option.';
      }
    } else if (steps[0] === '2') {
      // Find in SQLite
      const tickets = db.findTicketsByPhone(phoneNumber);

      if (tickets.length === 0) {
        response = 'END You have no tickets.';
      } else {
        const list = tickets.map((t) => `${t.event_name} - ${t.ticket_code}`).join('\n');
        response = `END Your Tickets:\n${list}`;
      }
    } else if (steps[0] === '3') {
      if (steps.length === 1) {
        response = `CON Wallet
1. Balance
2. Deposit
3. Withdraw
0. Back`;
      } else if (steps[1] === '0') {
        response = `CON Welcome to AVARA
1. Buy Ticket
2. My Tickets
3. Wallet
4. Events Near Me
5. Support
0. Exit`;
      } else if (steps[1] === '1') {
        response = 'END Your balance is 0 KES';
      } else if (steps[1] === '2') {
        response = `END Send money to Paybill 412345
Acc: Your Phone Number`;
      } else if (steps[1] === '3') {
        response = 'END Withdrawal sent to M-Pesa';
      } else {
        response = 'END Invalid option';
      }
    } else if (steps[0] === '4') {
      if (steps.length === 1) {
        const events = await getEventsList();
        const venues = [...new Set(events.map(e => e.venue))].slice(0, 9);

        if (venues.length === 0) {
          response = 'END No events available.';
        } else {
          let menu = 'CON Select Region:\n';
          venues.forEach((venue, index) => {
            menu += `${index + 1}. ${venue}\n`;
          });
          menu += '0. Back';
          response = menu;
        }
      } else if (steps.length === 2) {
        if (steps[1] === '0') {
          response = `CON Welcome to AVARA
1. Buy Ticket
2. My Tickets
3. Wallet
4. Events Near Me
5. Support
0. Exit`;
        } else {
          const events = await getEventsList();
          const venues = [...new Set(events.map(e => e.venue))];
          const selectedVenueIndex = parseInt(steps[1]) - 1;
          const selectedVenue = venues[selectedVenueIndex];

          if (!selectedVenue) {
            response = 'END Invalid region.';
          } else {
            const venueEvents = events.filter(e => e.venue === selectedVenue);
            const evts = venueEvents.slice(0, 10).map((e) => `${e.name} - ${e.price} KES`).join('\n');
            response = `END Events in ${selectedVenue}:\n${evts}`;
          }
        }
      } else {
        response = 'END Invalid option.';
      }
    } else if (steps[0] === '5') {
      if (steps.length === 1) {
        response = `CON Support
1. Request Call-Back
2. Report Issue
0. Back`;
      } else if (steps[1] === '0') {
        response = `CON Welcome to AVARA
1. Buy Ticket
2. My Tickets
3. Wallet
4. Events Near Me
5. Support
0. Exit`;
      } else if (steps[1] === '1') {
        response = 'END We will call you shortly.';
      } else if (steps[1] === '2') {
        response = 'END Issue reported. Thank you.';
      } else {
        response = 'END Invalid option.';
      }
    } else if (steps[0] === '0') {
      response = 'END Thank you for using AVARA';
    } else {
      response = 'END Invalid option';
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
  } catch (err) {
    console.error('USSD route error:', err);
    res.set('Content-Type', 'text/plain');
    res.send('END Something went wrong. Try again.');
  }
});

// Callback endpoint for STK Push (SQLite storage)
app.post('/daraja-callback', async (req, res) => {
  try {
    let merchantRequestId, checkoutRequestId, resultCode, resultDesc, amount, mpesaReceiptNumber, phoneNumber, transactionDate, provider;

    if (req.body.invoice) {
      // Intasend callback
      const body = req.body.invoice;
      merchantRequestId = body.invoice_id;
      checkoutRequestId = body.intasend_tracking_id;
      resultCode = body.state === 'COMPLETE' ? 0 : (body.state === 'FAILED' ? 1 : 2);
      resultDesc = body.failed_reason || 'Success';
      amount = Number(body.value);
      mpesaReceiptNumber = body.mpesa_reference;
      phoneNumber = body.customer_phone_number;
      transactionDate = body.updated_at;
      provider = 'intasend';
    } else {
      const body = (req.body && req.body.Body && req.body.Body.stkCallback) ? req.body.Body.stkCallback : null;
      if (body) {
        merchantRequestId = body.MerchantRequestID;
        checkoutRequestId = body.CheckoutRequestID;
        resultCode = Number(body.ResultCode);
        resultDesc = body.ResultDesc;

        const itemsArray = (body.CallbackMetadata && body.CallbackMetadata.Item) ? body.CallbackMetadata.Item : [];
        const items = itemsArray.reduce((acc, it) => {
          if (it && it.Name) acc[it.Name] = it.Value;
          return acc;
        }, {});

        amount = Number(items.Amount) || 0;
        mpesaReceiptNumber = items.MpesaReceiptNumber || null;
        phoneNumber = items.PhoneNumber || null;
        transactionDate = items.TransactionDate || null;
        provider = 'daraja';
      }
    }

    db.createTransaction({
      merchantRequestId,
      checkoutRequestId,
      resultCode,
      resultDesc,
      amount,
      mpesaReceiptNumber,
      phoneNumber,
      transactionDate,
      provider,
      rawCallback: req.body
    });

    console.log('💾 Transaction saved to SQLite');

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('Error handling callback:', err);
    res.status(200).json({ status: 'error' });
  }
});

app.get('/transactions', async (req, res) => {
  try {
    const rows = db.findLatestTransactions(50);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ status: 'error' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`✅ USSD Server (SQLite) ready on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});
