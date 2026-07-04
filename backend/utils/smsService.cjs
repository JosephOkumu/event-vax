/**
 * Phase 4: SMS Ticket Delivery Service
 *
 * After successful M-Pesa payment + NFT minting, this service sends
 * the user an SMS with their ticket details via Africa's Talking.
 *
 * SMS content includes:
 * - Ticket code (for quick reference)
 * - Event name
 * - Blockchain transaction hash (proof of ownership)
 * - Link to view ticket on the website
 */

const AfricasTalking = require('africastalking');

let at = null;
let db = null;

function getATClient() {
    if (at) return at;

    // Default to sandbox username if not provided (sandbox username is always 'sandbox')
    const username = process.env.AFRICASTALKING_USERNAME || 'sandbox';
    const apiKey = process.env.AFRICASTALKING_API_KEY || 'atsk_24e20cb8af81e8e18cfe5a0e591adade81f6f07c703748218961862b9ba6395a7ff83ec8';

    if (!apiKey) {
        throw new Error('AFRICASTALKING_API_KEY not set in .env');
    }

    at = AfricasTalking({ username, apiKey });
    return at;
}

// Initialize reference to database for logging
function setDatabase(dbInstance) {
    db = dbInstance;
}

/**
 * Send an SMS via Africa's Talking.
 * @param {string} to      - Phone number e.g. +254722549387
 * @param {string} message - SMS body (max 160 chars for 1 SMS)
 */
async function sendSMS(to, message) {
    const client = getATClient();
    const sms = client.SMS;

    const result = await sms.send({
        to: [to],
        message,
        // Leave out 'from' to use default shortcode/sender ID
    });

    console.log('📩 SMS sent:', JSON.stringify(result, null, 2));
    return result;
}

/**
 * Send SMS and log to database for USSD.
 * Handles logging even if SMS sending fails.
 * @param {object} params
 * @param {string} params.phoneNumber - Recipient phone number
 * @param {string} params.message - SMS message content
 * @param {string} params.messageType - Type of message (payment, ticket, error, etc.)
 * @param {string} params.ticketCode - Optional ticket code reference
 * @param {string} params.eventId - Optional event ID reference
 */
async function sendUssdSms({ phoneNumber, message, messageType = 'general', ticketCode = null, eventId = null }) {
    let result = null;
    let smsStatus = 'sent';

    // Try to send the SMS
    try {
        result = await sendSMS(phoneNumber, message);
        smsStatus = result.success ? 'sent' : 'failed';
    } catch (err) {
        console.error(`⚠️ SMS send failed for ${phoneNumber}:`, err.message);
        smsStatus = 'failed';
    }

    // Always log to database
    try {
        if (db && db.logSmsMessage) {
            db.logSmsMessage({
                phoneNumber,
                messageType,
                messageContent: message,
                status: smsStatus,
                ticketCode,
                eventId,
            });
        }
    } catch (dbErr) {
        console.error('⚠️ Failed to log SMS to database:', dbErr.message);
    }

    return result;
}

/**
 * Send ticket confirmation SMS after successful M-Pesa payment.
 * Called when payment is confirmed but minting hasn't happened yet.
 *
 * @param {object} params
 * @param {string} params.phoneNumber
 * @param {string} params.eventName
 * @param {string} params.ticketCode
 * @param {number} params.amountKes
 */
async function sendPaymentConfirmationSMS({ phoneNumber, eventName, ticketCode, amountKes }) {
    const message =
        `Payment Confirmation:\n` +
        `KES ${amountKes} received for ${eventName}.\n` +
        `Reference Code: ${ticketCode}\n` +
        `Your digital ticket is currently being generated. You will receive a final confirmation shortly.`;

    return sendSMS(phoneNumber, message);
}

/**
 * Send ticket delivery SMS after successful NFT minting.
 *
 * @param {object} params
 * @param {string} params.phoneNumber
 * @param {string} params.eventName
 * @param {string} params.ticketCode
 * @param {string} params.txHash         - Blockchain transaction hash
 * @param {string} params.walletAddress  - Custodial wallet that received the NFT
 * @param {string} [params.siteUrl]      - Website URL to view the ticket
 */
async function sendTicketDeliveredSMS({ phoneNumber, eventName, ticketCode, txHash, walletAddress, siteUrl }) {
    const explorerUrl = `https://testnet.snowtrace.io/tx/${txHash}`;
    const shortTx = `${txHash.slice(0, 8)}...${txHash.slice(-6)}`;

    const message =
        `Ticket Issued Successfully.\n` +
        `Event: ${eventName}\n` +
        `Ticket Code: ${ticketCode}\n` +
        `On-chain Verification: ${shortTx}\n` +
        `Link: ${explorerUrl}`;

    return sendSMS(phoneNumber, message);
}

/**
 * Send failure SMS if payment confirmed but minting failed.
 *
 * @param {object} params
 * @param {string} params.phoneNumber
 * @param {string} params.eventName
 * @param {string} params.ticketCode
 */
async function sendMintFailureSMS({ phoneNumber, eventName, ticketCode }) {
    const message =
        `EventVerse: Your KES payment was received for ${eventName}.\n` +
        `Your NFT minting is delayed. Your ticket code ${ticketCode} is valid.\n` +
        `Our team will resolve this within 24hrs.`;

    return sendSMS(phoneNumber, message);
}

/**
 * Send OTP for wallet linking (Phase 5).
 *
 * @param {string} phoneNumber
 * @param {string} otp
 */
async function sendOTPSMS(phoneNumber, otp) {
    const message =
        `EventVerse: Your verification code is ${otp}.\n` +
        `Enter this on the website to link your wallet.\n` +
        `Expires in 10 minutes.`;

    return sendSMS(phoneNumber, message);
}

module.exports = {
    sendSMS,
    sendUssdSms,
    setDatabase,
    sendPaymentConfirmationSMS,
    sendTicketDeliveredSMS,
    sendMintFailureSMS,
    sendOTPSMS,
};
