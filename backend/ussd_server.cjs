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
const { getOrCreateWallet } = require('./utils/walletManager.cjs');
const { recordPendingPayment, processCallback } = require('./utils/paymentService.cjs');
// Phase 3 (minting) will be imported here once built
let mintTicketOnChain = null;
try { mintTicketOnChain = require('./utils/mintService.cjs').mintTicketOnChain; } catch (_) { }
// Phase 4: SMS delivery
const sms = require('./utils/smsService.cjs');
const app = express();

// Initialize SQLite tables
db.initUssdTables();

// Initialize SMS with database logging
sms.setDatabase(db);

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

  // IntaSend requires phone in format 254XXXXXXXXX (no leading +)
  const sanitizedPhone = phoneNumber.replace(/^\+/, '');

  // M-Pesa minimum is 1 KES; round up any sub-1 amounts (e.g. 0.12 KES → 1 KES)
  const safeAmount = Math.max(1, Math.ceil(amount));

  const payload = {
    phone_number: sanitizedPhone,
    name: 'EventVerse User',
    email: `${sanitizedPhone}@ussd.eventvax.app`,
    amount: safeAmount,
    api_ref: metadata.accountRef || `ticket-${Date.now()}`,
    narrative: metadata.transactionDesc || 'Event Ticket',
    currency: 'KES',
  };

  console.log('IntaSend STK payload:', JSON.stringify(payload));
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
      // Can't send SMS because phone number is missing
    } else if (text === '') {
      response = `CON Welcome to EventVerse
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
          // Send SMS notification (non-blocking)
          sms.sendUssdSms({
            phoneNumber,
            message: 'EventVerse: No events are currently available. Please try again later.',
            messageType: 'notification',
          }).catch(err => console.error('SMS send error:', err && err.message || err));
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
          response = `CON Welcome to EventVerse
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
          // Send SMS for invalid option
          if (!event) {
            sms.sendUssdSms({
              phoneNumber,
              message: 'EventVerse: Invalid event selection. Please try again.',
              messageType: 'error',
            }).catch(err => console.error('SMS send error:', err && err.message || err));
          }
        }
      } else if (steps.length === 3) {
        if (steps[2] === '0') {
          response = 'END Transaction cancelled.';
          // Send SMS for cancelled transaction (non-blocking)
          sms.sendUssdSms({
            phoneNumber,
            message: 'EventVerse: Your ticket purchase has been cancelled.',
            messageType: 'notification',
          }).catch(err => console.error('SMS send error:', err && err.message || err));
        } else if (steps[2] === '1') {
          const eventMap = await getEventMap();
          const event = eventMap[steps[1]];
            if (!event) {
            response = 'END Invalid option.';
            sms.sendUssdSms({
              phoneNumber,
              message: 'EventVerse: Invalid event selection. Please try again.',
              messageType: 'error',
            }).catch(err => console.error('SMS send error:', err && err.message || err));
          } else {
            try {
              // Get or create a custodial wallet for this phone number
              const userWallet = getOrCreateWallet(phoneNumber);

              // Initiate STK Push and capture the checkoutRequestId
              const stkResponse = await initiateStkPush(phoneNumber, event.price, {
                accountRef: event.name,
                transactionDesc: 'EventVerse Ticket - KES to AVAX',
              });

              const ticketCode = Math.floor(10000 + Math.random() * 90000).toString();
              const checkoutId = stkResponse.id || stkResponse.CheckoutRequestID || `local-${Date.now()}`;

              // Record the pending payment so the callback can trigger minting
              recordPendingPayment({
                checkoutRequestId: checkoutId,
                merchantRequestId: stkResponse.invoice_id || stkResponse.MerchantRequestID || null,
                phoneNumber,
                ticketCode,
                eventId: event.id,
                eventName: event.name,
                amountKes: event.price,
                walletAddress: userWallet.address,
              });

              // Save the ticket (mint_status = 'pending' until callback confirms)
              db.createTicket({
                phoneNumber,
                eventId: event.id,
                eventName: event.name,
                price: event.price,
                ticketCode,
                walletAddress: userWallet.address,
                mintStatus: 'pending',
              });

              response = `END M-Pesa prompt sent.
Confirm payment on your phone.
Ticket Code: ${ticketCode}
(Valid once payment confirmed)`;

              // Send SMS with payment details (non-blocking)
              sms.sendUssdSms({
                phoneNumber,
                message: `EventVerse: M-Pesa payment prompt sent. Amount: KES ${event.price}. Event: ${event.name}. Ticket Code: ${ticketCode}. Confirm payment on your phone.`,
                messageType: 'payment',
                ticketCode,
                eventId: event.id,
              }).catch(err => console.error('SMS send error:', err && err.message || err));
            } catch (err) {
              console.error('Failed to process payment:', err);
              response = 'END Payment failed. Try again.';
              // Send SMS for payment error (non-blocking)
              sms.sendUssdSms({
                phoneNumber,
                message: 'EventVerse: Payment initiation failed. Please try again or contact support.',
                messageType: 'error',
              }).catch(err => console.error('SMS send error:', err && err.message || err));
            }
          }
        } else {
          response = 'END Invalid option.';
          // Send SMS for invalid option (non-blocking)
          sms.sendUssdSms({
            phoneNumber,
            message: 'EventVerse: Invalid selection. Please try again.',
            messageType: 'error',
          }).catch(err => console.error('SMS send error:', err && err.message || err));
        }
      } else {
        response = 'END Invalid option.';
      }
    } else if (steps[0] === '2') {
      // Find in SQLite
      const tickets = db.findTicketsByPhone(phoneNumber);

      if (tickets.length === 0) {
        response = 'END You have no tickets.';
        // Send SMS notification (non-blocking)
        sms.sendUssdSms({
          phoneNumber,
          message: 'EventVerse: You currently have no tickets. Visit our app or dial *300*222*2# to buy tickets.',
          messageType: 'notification',
        }).catch(err => console.error('SMS send error:', err && err.message || err));
      } else {
        const list = tickets.map((t) => `${t.event_name} - ${t.ticket_code}`).join('\n');
        response = `END Your Tickets:\n${list}`;
        // Send SMS with ticket list (non-blocking)
        sms.sendUssdSms({
          phoneNumber,
          message: `EventVerse: You have ${tickets.length} ticket(s). ${list.replace(/\n/g, ' | ')}`,
          messageType: 'ticket_list',
        }).catch(err => console.error('SMS send error:', err && err.message || err));
      }
    } else if (steps[0] === '3') {
      if (steps.length === 1) {
        response = `CON Wallet
1. Balance
2. Deposit
3. Withdraw
0. Back`;
      } else if (steps[1] === '0') {
        response = `CON Welcome to EventVerse
1. Buy Ticket
2. My Tickets
3. Wallet
4. Events Near Me
5. Support
0. Exit`;
      } else if (steps[1] === '1') {
        response = 'END Your balance is 0 KES';
        // Send SMS wallet balance (non-blocking)
        sms.sendUssdSms({
          phoneNumber,
          message: 'EventVerse: Your wallet balance is KES 0.00. Deposit to start buying tickets.',
          messageType: 'wallet',
        }).catch(err => console.error('SMS send error:', err && err.message || err));
      } else if (steps[1] === '2') {
        response = `END Send money to Paybill 412345
Acc: Your Phone Number`;
        // Send SMS deposit instructions (non-blocking)
        sms.sendUssdSms({
          phoneNumber,
          message: 'EventVerse: To deposit, send money via M-Pesa to Paybill 412345 with account ' + phoneNumber,
          messageType: 'wallet',
        }).catch(err => console.error('SMS send error:', err && err.message || err));
      } else if (steps[1] === '3') {
        response = 'END Withdrawal sent to M-Pesa';
        // Send SMS withdrawal confirmation (non-blocking)
        sms.sendUssdSms({
          phoneNumber,
          message: 'EventVerse: Your wallet withdrawal is being processed. You will receive funds via M-Pesa shortly.',
          messageType: 'wallet',
        }).catch(err => console.error('SMS send error:', err && err.message || err));
      } else {
        response = 'END Invalid option';
        // Send SMS for invalid option (non-blocking)
        sms.sendUssdSms({
          phoneNumber,
          message: 'EventVerse: Invalid wallet option. Please try again.',
          messageType: 'error',
        }).catch(err => console.error('SMS send error:', err && err.message || err));
      }
    } else if (steps[0] === '4') {
      if (steps.length === 1) {
        const events = await getEventsList();
        const venues = [...new Set(events.map(e => e.venue))].slice(0, 9);

        if (venues.length === 0) {
          response = 'END No events available.';
          // Send SMS notification (non-blocking)
          sms.sendUssdSms({
            phoneNumber,
            message: 'EventVerse: No events are currently available in your region. Please check back later.',
            messageType: 'notification',
          }).catch(err => console.error('SMS send error:', err && err.message || err));
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
          response = `CON Welcome to EventVerse
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
            // Send SMS for invalid region (non-blocking)
            sms.sendUssdSms({
              phoneNumber,
              message: 'EventVerse: Invalid region selection. Please try again.',
              messageType: 'error',
            }).catch(err => console.error('SMS send error:', err && err.message || err));
          } else {
            const venueEvents = events.filter(e => e.venue === selectedVenue);
            const evts = venueEvents.slice(0, 10).map((e) => `${e.name} - ${e.price} KES`).join('\n');
            response = `END Events in ${selectedVenue}:\n${evts}`;
            // Send SMS with event list for venue (non-blocking)
            sms.sendUssdSms({
              phoneNumber,
              message: `EventVerse: Events in ${selectedVenue}: ${evts.replace(/\n/g, ' | ')}`,
              messageType: 'event_list',
            }).catch(err => console.error('SMS send error:', err && err.message || err));
          }
        }
      } else {
        response = 'END Invalid option.';
          // Send SMS for invalid option (non-blocking)
          sms.sendUssdSms({
            phoneNumber,
            message: 'EventVerse: Invalid selection. Please try again.',
            messageType: 'error',
          }).catch(err => console.error('SMS send error:', err && err.message || err));
      }
    } else if (steps[0] === '5') {
      if (steps.length === 1) {
        response = `CON Support
1. Request Call-Back
2. Report Issue
0. Back`;
      } else if (steps[1] === '0') {
        response = `CON Welcome to EventVerse
1. Buy Ticket
2. My Tickets
3. Wallet
4. Events Near Me
5. Support
0. Exit`;
      } else if (steps[1] === '1') {
        response = 'END We will call you shortly.';
        // Send SMS for support callback request (non-blocking)
        sms.sendUssdSms({
          phoneNumber,
          message: 'EventVerse: Your support request has been received. Our team will call you within 24 hours.',
          messageType: 'support',
        }).catch(err => console.error('SMS send error:', err && err.message || err));
      } else if (steps[1] === '2') {
        response = 'END Issue reported. Thank you.';
        // Send SMS for issue report (non-blocking)
        sms.sendUssdSms({
          phoneNumber,
          message: 'EventVerse: Your issue has been recorded. Our support team will contact you shortly. Thank you.',
          messageType: 'support',
        }).catch(err => console.error('SMS send error:', err && err.message || err));
      } else {
        response = 'END Invalid option.';
        // Send SMS for invalid option (non-blocking)
        sms.sendUssdSms({
          phoneNumber,
          message: 'EventVerse: Invalid support option. Please try again.',
          messageType: 'error',
        }).catch(err => console.error('SMS send error:', err && err.message || err));
      }
    } else if (steps[0] === '0') {
      response = 'END Thank you for using EventVerse';
      // Send SMS goodbye message (non-blocking)
      sms.sendUssdSms({
        phoneNumber,
        message: 'EventVerse: Thank you for using our service! Visit us at eventvax.app anytime. Have a great day!',
        messageType: 'exit',
      }).catch(err => console.error('SMS send error:', err && err.message || err));
    } else {
      response = 'END Invalid option';
      // Send SMS for invalid option (non-blocking)
      sms.sendUssdSms({
        phoneNumber,
        message: 'EventVerse: Invalid option. Dial *300*222*2# to start again.',
        messageType: 'error',
      }).catch(err => console.error('SMS send error:', err && err.message || err));
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
  } catch (err) {
    console.error('USSD route error:', err);
    const response = 'END Something went wrong. Try again.';
    // Send SMS for system error
    const phoneNumber = req.body?.phoneNumber;
    if (phoneNumber) {
      sms.sendUssdSms({
        phoneNumber,
        message: 'EventVerse: An unexpected error occurred. Please try again or contact support at +254 700 000 000.',
        messageType: 'error',
      }).catch(err => console.error('SMS send error:', err && err.message || err));
    }
    res.set('Content-Type', 'text/plain');
    res.send(response);
  }
});

// Callback endpoint for STK Push (Phase 2: payment confirmation + Phase 3: mint trigger)
app.post('/daraja-callback', async (req, res) => {
  // Always respond 200 immediately to M-Pesa/IntaSend
  res.status(200).json({ status: 'received' });

  // Log raw callback so we can see exactly what IntaSend sends
  console.log('📩 CALLBACK RECEIVED:', JSON.stringify(req.body, null, 2));

  // Verify the IntaSend challenge token
  const expectedChallenge = process.env.INTASEND_CHALLENGE;
  const receivedChallenge = req.body.challenge;
  if (expectedChallenge && receivedChallenge !== expectedChallenge) {
    console.warn(`⚠️ Challenge mismatch — received: "${receivedChallenge}", expected: "${expectedChallenge}". Ignoring callback.`);
    return;
  }

  try {
    const { success, pendingPayment, parsed } = processCallback(req.body);

    // Save transaction record regardless of outcome
    db.createTransaction({
      merchantRequestId: parsed.merchantRequestId,
      checkoutRequestId: parsed.checkoutRequestId,
      resultCode: parsed.resultCode,
      resultDesc: parsed.resultDesc,
      amount: parsed.amount,
      mpesaReceiptNumber: parsed.mpesaReceiptNumber,
      phoneNumber: parsed.phoneNumber,
      transactionDate: parsed.transactionDate,
      provider: parsed.provider,
      rawCallback: req.body,
    });

    if (!success) {
      console.log(`❌ Payment failed for checkout ${parsed.checkoutRequestId}: ${parsed.resultDesc}`);
      // Update ticket mint_status to 'payment_failed'
      if (pendingPayment) {
        db.updateTicketMint(pendingPayment.ticket_code, {
          tokenId: null,
          txHash: null,
          mintStatus: 'payment_failed',
        });
      }
      return;
    }

    console.log(`✅ Payment confirmed for ${parsed.phoneNumber} - KES ${parsed.amount}`);

    if (!pendingPayment) {
      console.warn('⚠️  No pending payment found for checkoutRequestId:', parsed.checkoutRequestId);
      return;
    }

    // Phase 4: Notify user immediately that payment is received
    try {
      await sms.sendPaymentConfirmationSMS({
        phoneNumber: pendingPayment.phone_number,
        eventName: pendingPayment.event_name,
        ticketCode: pendingPayment.ticket_code,
        amountKes: pendingPayment.amount_kes,
      });
    } catch (smsErr) {
      console.error('⚠️ Payment confirmation SMS failed:', smsErr.message);
    }

    // ── Phase 3: Trigger blockchain minting ──────────────────────────────
    if (mintTicketOnChain) {
      try {
        console.log(`🔗 Triggering NFT mint for ticket ${pendingPayment.ticket_code}...`);
        const mintResult = await mintTicketOnChain({
          walletAddress: pendingPayment.wallet_address,
          eventId: pendingPayment.event_id,
          ticketCode: pendingPayment.ticket_code,
          amountKes: pendingPayment.amount_kes,
        });

        // Phase 6: Generate QR data for gate verification
        const qrData = {
          type: 'ussd',
          ticketCode: pendingPayment.ticket_code,
          walletAddress: pendingPayment.wallet_address,
          eventId: pendingPayment.event_id,
          eventName: pendingPayment.event_name,
          tokenId: mintResult.tokenId,
          txHash: mintResult.txHash,
          ticketAddress: mintResult.ticketAddress,
        };

        db.updateTicketMint(pendingPayment.ticket_code, {
          tokenId: mintResult.tokenId,
          txHash: mintResult.txHash,
          mintStatus: 'minted',
          qrData,
        });
        console.log(`🎟️  NFT minted: tokenId=${mintResult.tokenId} txHash=${mintResult.txHash}`);

        // Phase 4: Send ticket delivery SMS with tx proof
        try {
          await sms.sendTicketDeliveredSMS({
            phoneNumber: pendingPayment.phone_number,
            eventName: pendingPayment.event_name,
            ticketCode: pendingPayment.ticket_code,
            txHash: mintResult.txHash,
            walletAddress: pendingPayment.wallet_address,
          });
        } catch (smsErr) {
          console.error('⚠️ Ticket delivery SMS failed:', smsErr.message);
        }
      } catch (mintErr) {
        console.error('❌ Minting failed, will retry later:', mintErr.message);
        db.updateTicketMint(pendingPayment.ticket_code, {
          tokenId: null,
          txHash: null,
          mintStatus: 'mint_failed',
        });

        // Phase 4: Notify user of delay
        try {
          await sms.sendMintFailureSMS({
            phoneNumber: pendingPayment.phone_number,
            eventName: pendingPayment.event_name,
            ticketCode: pendingPayment.ticket_code,
          });
        } catch (smsErr) {
          console.error('⚠️ Mint failure SMS failed:', smsErr.message);
        }
      }
    } else {
      // mintService not yet loaded — mark as payment_confirmed, mint later
      db.updateTicketMint(pendingPayment.ticket_code, {
        tokenId: null,
        txHash: null,
        mintStatus: 'payment_confirmed',
      });
      console.log('ℹ️  mintService not loaded yet — ticket marked as payment_confirmed for later minting.');
    }
  } catch (err) {
    console.error('Error processing callback:', err);
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

const PORT = Number(process.env.USSD_PORT) || 3000;

app.listen(PORT, () => {
  console.log(`✅ USSD Server (SQLite) ready on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});
