/**
 * Phase 1: Custodial Wallet Manager
 *
 * Generates and stores a blockchain wallet for each USSD user
 * identified by their phone number. The platform holds the keys
 * on behalf of the user (custodial model).
 *
 * ⚠️  In production, encrypt private keys before storing.
 */

const { ethers } = require('ethers');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'events.db');
const db = new Database(dbPath);

// Create the custodial wallets table if it doesn't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS ussd_wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT UNIQUE NOT NULL,
        wallet_address TEXT NOT NULL,
        private_key TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

console.log('✅ Custodial wallets table initialized');

/**
 * Get or create a custodial wallet for a given phone number.
 * @param {string} phoneNumber - The user's phone number (e.g. +254722549387)
 * @returns {{ address: string, privateKey: string, isNew: boolean }}
 */
function getOrCreateWallet(phoneNumber) {
    // Check if wallet already exists
    const existing = db
        .prepare('SELECT * FROM ussd_wallets WHERE phone_number = ?')
        .get(phoneNumber);

    if (existing) {
        return {
            address: existing.wallet_address,
            privateKey: existing.private_key,
            isNew: false,
        };
    }

    // Generate a fresh wallet
    const wallet = ethers.Wallet.createRandom();

    db.prepare(`
        INSERT INTO ussd_wallets (phone_number, wallet_address, private_key)
        VALUES (?, ?, ?)
    `).run(phoneNumber, wallet.address, wallet.privateKey);

    console.log(`🆕 New custodial wallet created for ${phoneNumber}: ${wallet.address}`);

    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        isNew: true,
    };
}

/**
 * Look up a wallet by phone number.
 * @param {string} phoneNumber
 * @returns {{ address: string, privateKey: string } | null}
 */
function getWalletByPhone(phoneNumber) {
    const row = db
        .prepare('SELECT * FROM ussd_wallets WHERE phone_number = ?')
        .get(phoneNumber);

    if (!row) return null;

    return {
        address: row.wallet_address,
        privateKey: row.private_key,
    };
}

/**
 * Look up a phone number by wallet address.
 * @param {string} walletAddress
 * @returns {string | null}
 */
function getPhoneByWallet(walletAddress) {
    const row = db
        .prepare('SELECT phone_number FROM ussd_wallets WHERE LOWER(wallet_address) = LOWER(?)')
        .get(walletAddress);
    return row ? row.phone_number : null;
}

module.exports = {
    getOrCreateWallet,
    getWalletByPhone,
    getPhoneByWallet,
};
