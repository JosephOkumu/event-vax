require('dotenv').config();
const express = require('express');
const africastalking_api = require('africastalking');
const axios = require('axios');
const moment = require('moment');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// Trust the first proxy (needed for ngrok and rate limiting)
app.set('trust proxy', 1);

// Verify required environment variables
const requiredEnvVars = ['AFRICASTALKING_API_KEY', 'AFRICASTALKING_USERNAME', 'MONGODB_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    console.error('Make sure you have a .env file with these values before starting the server.');
    process.exit(1);
  }
}

// Initialize Africastalking client
const africastalking = africastalking_api({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME
});

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Parse JSON only for application/json, and urlencoded for form data
app.use(express.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: false }));

// Debug middleware: log headers and parsed body for every request
app.use((req, res, next) => {
  console.log('--- Incoming Request ---');
  console.log('Headers:', req.headers);
  console.log('Parsed body:', req.body);
  next();
});

// --- MongoDB connection and transaction model ---
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message || err);
    process.exit(1);
  }
}

const transactionSchema = new mongoose.Schema(
  {
    merchantRequestId: String,
    checkoutRequestId: String,
    resultCode: Number,
    resultDesc: String,

    amount: Number,
    mpesaReceiptNumber: String,
    phoneNumber: String,
    transactionDate: String, // keep format as Daraja returns (yyyymmddHHMMSS)

    rawCallback: mongoose.Schema.Types.Mixed // full payload
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

// Helper: initiate STK Push using Intasend API
async function initiateStkPush(phone, amount, { accountRef = 'BimaWater', transactionDesc = 'Water Bill Payment' } = {}) {
  // Read Intasend credentials from env
  const PUBLIC_KEY = process.env.INTASEND_PUBLIC_KEY || '';
  const PRIVATE_KEY = process.env.INTASEND_PRIVATE_KEY || '';
  const TEST_MODE = process.env.INTASEND_TEST_MODE === 'true';
  const WEBHOOK_URL = process.env.INTASEND_WEBHOOK_URL || (process.env.NGROK_URL ? `${process.env.NGROK_URL}/daraja-callback` : 'https://your-callback-url.example.com/daraja-callback');

  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    throw new Error('Missing INTASEND_PUBLIC_KEY or INTASEND_PRIVATE_KEY in environment variables');
  }

  // Normalize phone to 2547XXXXXXXX or 254 prefix expected by Intasend
  let formattedPhone = phone.replace(/[^0-9]/g, '');
  if (!formattedPhone.startsWith('254')) {
    // assume user entered local number like 07XXXXXXXX
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    }
  }

  // call Intasend STK Push
  const payload = {
    public_key: PUBLIC_KEY,
    private_key: PRIVATE_KEY,
    test_mode: TEST_MODE,
    amount: amount,
    phone_number: formattedPhone,
    api_ref: accountRef + '-' + Date.now(),
    webhook_url: WEBHOOK_URL
  };

  const stkRes = await axios.post('https://sandbox.intasend.com/api/v1/payment/mpesa-stk-push/', payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PRIVATE_KEY}`
    }
  });

  return stkRes.data; // caller inspects invoice object
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// SMS endpoint (unchanged)
app.post('/send-sms', async (req, res) => {
  const { phoneNumber, message = 'Default message from Africastalking' } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Phone number is required' 
    });
  }

  if (!/^\+?\d{10,15}$/.test(phoneNumber)) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Invalid phone number format. Please use international format (+254...)' 
    });
  }

  try {
    const result = await africastalking.SMS.send({
      to: phoneNumber,
      message: message,
      from: 'Bima'
    });

    res.status(200).json({
      status: 'success',
      data: result
    });

  } catch (error) {
    console.error('SMS sending error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send SMS',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// USSD endpoint (keeps behaviour, but uses initiateStkPush helper and improved validation)
app.post('/ussd', async (req, res) => {
  const {
    phoneNumber,
    sessionId,
    serviceCode,
    text = ''
  } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Phone number is required' 
    });
  }

  let response = '';
  const textArray = text.split('*');
  const lastInput = textArray[textArray.length - 1];
  let smsToSend = null;
  let smsMessage = '';

  // USSD Water Management Menu
  if (text === '') {
    response = `CON Welcome to Bima.\n1. Meter Reading\n2. Pay Water Bill\n3. Report Issue\n0. Exit`;
  } else if (text === '1') {
    const usage = '12,500 Litres';
    response = `END Your current water consumption is ${usage}.`;
  } else if (text === '2') {
    response = `CON Enter amount to pay:`;
  } else if (text.startsWith('2*')) {
    const amount = textArray[1];
    if (!amount || isNaN(amount)) {
      response = `END Invalid amount entered.`;
    } else {
      // Initiate STK Push
      try {
        const stkResp = await initiateStkPush(phoneNumber, amount, { accountRef: 'BimaWater', transactionDesc: 'Water Bill Payment' });

        // Intasend returns invoice object on success
        if (stkResp && stkResp.invoice) {
          response = `END STK Push initiated. Complete payment on your phone.`;
        } else {
          console.error('STK Push failed response:', stkResp);
          response = `END Failed to initiate payment. Try again later.`;
        }
      } catch (err) {
        console.error('STK Push error:', (err.response && err.response.data) || err.message || err);
        response = `END Payment request failed. Please try again later.`;
      }
    }
  } else if (text === '3') {
    response = `CON Which issue are you reporting:\n1. Water outage\n2. Pipe leakage`;
  } else if (text.startsWith('3*')) {
    const issueOption = textArray[1];
    let issueType = '';
    if (issueOption === '1') {
      issueType = 'Water outage';
    } else if (issueOption === '2') {
      issueType = 'Pipe leakage';
    }
    if (issueType) {
      response = `END Thank you for reporting: ${issueType}. Our team will address it shortly.`;
      smsToSend = phoneNumber; // Reporting user
      smsMessage = `ALERT: Household ${phoneNumber} reported a '${issueType}'. Please investigate.`;
    } else {
      response = `END Invalid issue option selected.`;
    }
  } else if (text === '0') {
    response = `END Thank you for using Bima.`;
  } else {
    response = `END Invalid option selected.`;
  }

  // Send SMS alert for issue reporting
  if (response.startsWith('END') && smsToSend && smsMessage) {
    try {
      await africastalking.SMS.send({
        to: smsToSend,
        message: smsMessage,
        from: 'Bima'
      });
      console.log(`SMS sent to ${smsToSend}: ${smsMessage}`);
    } catch (error) {
      console.error('SMS sending error:', error);
    }
  }

  // Send SMS with the last message shown to the user at the end of every USSD session
  if (response.startsWith('END')) {
    try {
      await africastalking.SMS.send({
        to: phoneNumber,
        message: response.replace(/^END\s*/, ''), // Remove "END " prefix from message
        from: 'Bima'
      });
      console.log(`USSD session end message sent to ${phoneNumber}: ${response}`);
    } catch (error) {
      console.error('SMS sending error for USSD session end message:', error);
    }
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});

// Callback endpoint for STK Push (handles both Daraja and Intasend)
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
      // Daraja callback
      const body = (req.body && req.body.Body && req.body.Body.stkCallback) ? req.body.Body.stkCallback : null;
      if (!body) {
        console.warn('Received callback with unexpected structure:', req.body);
        return res.status(200).json({ status: 'ignored' });
      }

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

    const doc = await Transaction.create({
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

    console.log('💾 Saved transaction:', doc._id.toString());

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('Error handling callback:', err);
    res.status(200).json({ status: 'error' });
  }
});

// Simple route to view recent transactions
app.get('/transactions', async (req, res) => {
  try {
    const rows = await Transaction.find().sort({ createdAt: -1 }).limit(50);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ status: 'error' });
  }
});

// Start server after DB connection
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
