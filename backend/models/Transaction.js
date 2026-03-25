// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    merchantRequestId: String,
    checkoutRequestId: String,
    resultCode: Number,
    resultDesc: String,

    amount: Number,
    mpesaReceiptNumber: String,
    phoneNumber: String,
    transactionDate: String, // keep as string from callback (yyyymmddHHMMSS)

    provider: String, // 'daraja' or 'intasend'

    rawCallback: Object, // full payload for audit/debug
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);