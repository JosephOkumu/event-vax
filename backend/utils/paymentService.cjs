/**
 * Phase 2: Payment Confirmation Service
 *
 * Manages the lifecycle of STK Push payments:
 * - Records a pending payment when STK is initiated
 * - On callback, confirms or rejects the payment
 * - Triggers blockchain minting only on success (resultCode === 0)
 *
 * Currency note:
 *   - Payment from user:  KES (M-Pesa)
 *   - Gas fees for mint:  AVAX (paid by platform admin wallet)
 *   - User never handles crypto directly
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'events.db');
const db = new Database(dbPath);

// Create pending payments table
db.exec(`
    CREATE TABLE IF NOT EXISTS ussd_pending_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        checkout_request_id TEXT UNIQUE NOT NULL,
        merchant_request_id TEXT,
        phone_number TEXT NOT NULL,
        ticket_code TEXT NOT NULL,
        event_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        amount_kes REAL NOT NULL,
        wallet_address TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME
    );
`);

console.log('✅ Pending payments table initialized');

/**
 * Record a pending STK Push payment.
 * Called right after initiateStkPush() succeeds.
 */
function recordPendingPayment({ checkoutRequestId, merchantRequestId, phoneNumber, ticketCode, eventId, eventName, amountKes, walletAddress }) {
    return db.prepare(`
        INSERT OR REPLACE INTO ussd_pending_payments
            (checkout_request_id, merchant_request_id, phone_number, ticket_code, event_id, event_name, amount_kes, wallet_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(checkoutRequestId, merchantRequestId, phoneNumber, ticketCode, eventId, eventName, amountKes, walletAddress);
}

/**
 * Find a pending payment by its checkoutRequestId.
 */
function findPendingPayment(checkoutRequestId) {
    return db.prepare(`
        SELECT * FROM ussd_pending_payments WHERE checkout_request_id = ?
    `).get(checkoutRequestId);
}

/**
 * Mark a pending payment as resolved (success or failed).
 */
function resolvePendingPayment(checkoutRequestId, status) {
    return db.prepare(`
        UPDATE ussd_pending_payments
        SET status = ?, resolved_at = CURRENT_TIMESTAMP
        WHERE checkout_request_id = ?
    `).run(status, checkoutRequestId);
}

/**
 * Process an incoming M-Pesa/IntaSend callback.
 * Returns { success, pendingPayment } so the caller can trigger minting.
 *
 * @param {object} rawBody - Raw callback body from Daraja or IntaSend
 * @returns {{ success: boolean, pendingPayment: object|null, parsed: object }}
 */
function processCallback(rawBody) {
    let checkoutRequestId = null;
    let resultCode = -1;
    let resultDesc = '';
    let amount = 0;
    let mpesaReceiptNumber = null;
    let phoneNumber = null;
    let transactionDate = null;
    let provider = 'unknown';
    let merchantRequestId = null;

    if (rawBody.invoice) {
        // ── IntaSend callback ─────────────────────────────────────────────
        const inv = rawBody.invoice;
        checkoutRequestId = inv.intasend_tracking_id;
        merchantRequestId = inv.invoice_id;
        resultCode = inv.state === 'COMPLETE' ? 0 : 1;
        resultDesc = inv.failed_reason || 'Success';
        amount = Number(inv.value);
        mpesaReceiptNumber = inv.mpesa_reference;
        phoneNumber = inv.customer_phone_number;
        transactionDate = inv.updated_at;
        provider = 'intasend';
    } else if (rawBody.Body && rawBody.Body.stkCallback) {
        // ── Daraja STK Push callback ──────────────────────────────────────
        const cb = rawBody.Body.stkCallback;
        checkoutRequestId = cb.CheckoutRequestID;
        merchantRequestId = cb.MerchantRequestID;
        resultCode = Number(cb.ResultCode);
        resultDesc = cb.ResultDesc;
        provider = 'daraja';

        const items = (cb.CallbackMetadata && cb.CallbackMetadata.Item) ? cb.CallbackMetadata.Item : [];
        const meta = items.reduce((acc, it) => { if (it && it.Name) acc[it.Name] = it.Value; return acc; }, {});
        amount = Number(meta.Amount) || 0;
        mpesaReceiptNumber = meta.MpesaReceiptNumber || null;
        phoneNumber = meta.PhoneNumber ? String(meta.PhoneNumber) : null;
        transactionDate = meta.TransactionDate ? String(meta.TransactionDate) : null;
    }

    const parsed = { checkoutRequestId, merchantRequestId, resultCode, resultDesc, amount, mpesaReceiptNumber, phoneNumber, transactionDate, provider };

    // Find the matching pending payment
    const pendingPayment = checkoutRequestId ? findPendingPayment(checkoutRequestId) : null;

    const success = resultCode === 0;

    if (pendingPayment) {
        resolvePendingPayment(checkoutRequestId, success ? 'confirmed' : 'failed');
    }

    return { success, pendingPayment, parsed };
}

module.exports = {
    recordPendingPayment,
    findPendingPayment,
    resolvePendingPayment,
    processCallback,
};
