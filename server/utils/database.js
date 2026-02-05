import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database connection
const dbPath = join(__dirname, '..', 'data', 'events.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create events table
const createEventsTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      venue TEXT NOT NULL,
      regular_price TEXT,
      vip_price TEXT,
      vvip_price TEXT,
      description TEXT,
      flyer_image TEXT,
      ipfs_image_hash TEXT,
      ipfs_metadata_hash TEXT,
      content_hash TEXT,
      creator_address TEXT,
      blockchain_tx_hash TEXT,
      blockchain_event_id INTEGER,
      poap_ipfs_hash TEXT,
      poap_content_hash TEXT,
      poap_expiry TEXT,
      poap_supply_type TEXT,
      poap_supply_count INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

    db.exec(sql);
    console.log('✅ Events table created/verified');
};

// Create tickets table
const createTicketsTable = () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      wallet_address TEXT NOT NULL,
      tier_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      qr_code TEXT,
      transaction_hash TEXT,
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `;

    db.exec(sql);
    console.log('✅ Tickets table created/verified');
};

// Initialize database
export const initDatabase = () => {
    try {
        createEventsTable();
        createTicketsTable();
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
};

// Insert new event
export const insertEvent = (eventData) => {
    const sql = `
    INSERT INTO events (
      event_name, event_date, venue, regular_price, 
      vip_price, vvip_price, description, flyer_image, 
      ipfs_image_hash, ipfs_metadata_hash, content_hash,
      creator_address, blockchain_tx_hash, blockchain_event_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const stmt = db.prepare(sql);
    const result = stmt.run(
        eventData.eventName,
        eventData.eventDate,
        eventData.venue,
        eventData.regularPrice || null,
        eventData.vipPrice || null,
        eventData.vvipPrice || null,
        eventData.description || null,
        eventData.flyerImage || null,
        eventData.ipfsImageHash || null,
        eventData.ipfsMetadataHash || null,
        eventData.contentHash || null,
        eventData.creatorAddress || null,
        eventData.blockchainTxHash || null,
        eventData.blockchainEventId || null
    );

    return result.lastInsertRowid;
};

// Get all events
export const getAllEvents = () => {
    const sql = 'SELECT * FROM events ORDER BY created_at DESC';
    return db.prepare(sql).all();
};

// Get event by ID
export const getEventById = (id) => {
    const sql = 'SELECT * FROM events WHERE id = ?';
    return db.prepare(sql).get(id);
};

// Get events by creator address
export const getEventsByCreator = (creatorAddress) => {
    const sql = `
        SELECT e.*, 
               COUNT(DISTINCT t.wallet_address) as attendees
        FROM events e
        LEFT JOIN tickets t ON e.id = t.event_id
        WHERE LOWER(e.creator_address) = LOWER(?)
        GROUP BY e.id
        ORDER BY e.event_date DESC
    `;
    return db.prepare(sql).all(creatorAddress);
};

// Update event
export const updateEvent = (id, eventData) => {
    const sql = `
    UPDATE events 
    SET event_name = ?, event_date = ?, venue = ?, 
        regular_price = ?, vip_price = ?, vvip_price = ?,
        description = ?, flyer_image = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

    const stmt = db.prepare(sql);
    const result = stmt.run(
        eventData.eventName,
        eventData.eventDate,
        eventData.venue,
        eventData.regularPrice || null,
        eventData.vipPrice || null,
        eventData.vvipPrice || null,
        eventData.description || null,
        eventData.flyerImage || null,
        id
    );

    return result.changes;
};

// Delete event
export const deleteEvent = (id) => {
    const sql = 'DELETE FROM events WHERE id = ?';
    const stmt = db.prepare(sql);
    const result = stmt.run(id);
    return result.changes;
};

// Update event POAP data
export const updateEventPoap = (id, poapData) => {
    const sql = `
        UPDATE events 
        SET poap_ipfs_hash = ?, poap_content_hash = ?, 
            poap_expiry = ?, poap_supply_type = ?, 
            poap_supply_count = ?, poap_image_base64 = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    const stmt = db.prepare(sql);
    const result = stmt.run(
        poapData.ipfsHash || null,
        poapData.contentHash || null,
        poapData.expiryDate || null,
        poapData.supplyType || null,
        poapData.supplyCount || null,
        poapData.imageBase64 || null,
        id
    );
    
    return result.changes;
};

export default db;
