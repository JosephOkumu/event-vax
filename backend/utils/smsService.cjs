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

function getATClient() {
    if (at) return at;

    const username = process.env.AFRICASTALKING_USERNAME;
    const apiKey = process.env.AFRICASTALKING_API_KEY;

    if (!username || !apiKey) {
        throw new Error('AFRICASTALKING_USERNAME or AFRICASTALKING_API_KEY not set in .env');
    }

    at = AfricasTalking({ username, apiKey });
    return at;
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
        `EventVerse: Payment of KES ${amountKes} received!\n` +
        `Event: ${eventName}\n` +
        `Ticket Code: ${ticketCode}\n` +
        `Your NFT ticket is being minted on Avalanche. You will receive another SMS shortly.`;

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
        `🎟 EventVerse Ticket Confirmed!\n` +
        `Event: ${eventName}\n` +
        `Code: ${ticketCode}\n` +
        `Blockchain proof: ${shortTx}\n` +
        `View: ${explorerUrl}`;

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
    sendPaymentConfirmationSMS,
    sendTicketDeliveredSMS,
    sendMintFailureSMS,
    sendOTPSMS,
};
