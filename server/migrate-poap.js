import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'data', 'events.db');
const db = new Database(dbPath);

console.log('🔄 Migrating database for POAP support...');

try {
  db.exec(`
    ALTER TABLE events ADD COLUMN poap_ipfs_hash TEXT;
    ALTER TABLE events ADD COLUMN poap_content_hash TEXT;
    ALTER TABLE events ADD COLUMN poap_expiry TEXT;
    ALTER TABLE events ADD COLUMN poap_supply_type TEXT;
    ALTER TABLE events ADD COLUMN poap_supply_count INTEGER;
  `);
  console.log('✅ POAP columns added successfully');
} catch (error) {
  if (error.message.includes('duplicate column')) {
    console.log('ℹ️  POAP columns already exist');
  } else {
    console.error('❌ Migration failed:', error.message);
  }
}

db.close();
