import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'data', 'events.db');
const db = new Database(dbPath);

console.log('🔄 Migrating database for POAP system...');

// Add POAP columns to events table
try {
  db.exec(`
    ALTER TABLE events ADD COLUMN poap_ipfs_hash TEXT;
    ALTER TABLE events ADD COLUMN poap_content_hash TEXT;
    ALTER TABLE events ADD COLUMN poap_expiry TEXT;
    ALTER TABLE events ADD COLUMN poap_supply_type TEXT;
    ALTER TABLE events ADD COLUMN poap_supply_count INTEGER;
  `);
  console.log('✅ POAP columns added to events table');
} catch (error) {
  if (error.message.includes('duplicate column')) {
    console.log('ℹ️  POAP columns already exist in events table');
  } else {
    console.error('❌ Events table migration failed:', error.message);
  }
}

// Create POAP requests table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS poap_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      wallet_address TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      tx_hash TEXT,
      retry_count INTEGER DEFAULT 0,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, wallet_address)
    )
  `);
  console.log('✅ POAP requests table created');
} catch (error) {
  console.error('❌ POAP requests table creation failed:', error.message);
}

db.close();
console.log('✅ POAP system migration complete');
