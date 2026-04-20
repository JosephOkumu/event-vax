const Database = require('better-sqlite3');
const path = require('path');

// Path to your existing SQLite database
const dbPath = path.join(__dirname, '..', 'data', 'events.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize USSD tables
function initUssdTables() {
    // USSD Tickets Table
    const createTicketsTable = `
        CREATE TABLE IF NOT EXISTS ussd_tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL,
            event_id TEXT NOT NULL,
            event_name TEXT NOT NULL,
            price REAL NOT NULL,
            ticket_code TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // USSD Transactions Table (for payment callbacks)
    const createTransactionsTable = `
        CREATE TABLE IF NOT EXISTS ussd_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            merchant_request_id TEXT,
            checkout_request_id TEXT,
            result_code INTEGER,
            result_desc TEXT,
            amount REAL,
            mpesa_receipt_number TEXT,
            phone_number TEXT,
            transaction_date TEXT,
            provider TEXT,
            raw_callback TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;

    db.exec(createTicketsTable);
    db.exec(createTransactionsTable);
    console.log('✅ USSD SQLite tables initialized');
}

// Database helper functions
const dbHelpers = {
    // Tickets
    createTicket: (ticketData) => {
        const stmt = db.prepare(`
            INSERT INTO ussd_tickets (phone_number, event_id, event_name, price, ticket_code)
            VALUES (?, ?, ?, ?, ?)
        `);
        return stmt.run(
            ticketData.phoneNumber,
            ticketData.eventId,
            ticketData.eventName,
            ticketData.price,
            ticketData.ticketCode
        );
    },

    findTicketsByPhone: (phoneNumber) => {
        return db.prepare('SELECT * FROM ussd_tickets WHERE phone_number = ? ORDER BY created_at DESC').all(phoneNumber);
    },

    // Transactions
    createTransaction: (txData) => {
        const stmt = db.prepare(`
            INSERT INTO ussd_transactions (
                merchant_request_id, checkout_request_id, result_code, result_desc,
                amount, mpesa_receipt_number, phone_number, transaction_date,
                provider, raw_callback
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            txData.merchantRequestId,
            txData.checkoutRequestId,
            txData.resultCode,
            txData.resultDesc,
            txData.amount,
            txData.mpesaReceiptNumber,
            txData.phoneNumber,
            txData.transactionDate,
            txData.provider,
            txData.rawCallback ? JSON.stringify(txData.rawCallback) : null
        );
    },

    findLatestTransactions: (limit = 50) => {
        return db.prepare('SELECT * FROM ussd_transactions ORDER BY created_at DESC LIMIT ?').all(limit);
    }
};

module.exports = {
    db,
    initUssdTables,
    ...dbHelpers
};
