import express from 'express';
import db from '../utils/database.js';

const router = express.Router();

// Quick pre-validation before blockchain call
router.post('/verify-quick', async (req, res) => {
  try {
    console.log('🔵 [DEBUG] Quick verification request:', req.body);
    const { eventId, attendee } = req.body;
    
    const ticket = db.prepare(`
      SELECT t.*, e.event_date 
      FROM tickets t
      LEFT JOIN events e ON t.event_id = e.id
      WHERE t.event_id = ? AND LOWER(t.wallet_address) = LOWER(?)
    `).get(eventId, attendee);
    
    console.log('🔵 [DEBUG] Ticket found:', ticket);
    
    if (!ticket) {
      console.log('🔴 [DEBUG] Ticket not found');
      return res.json({ valid: false, reason: 'Ticket not found' });
    }
    
    if (ticket.checked_in) {
      console.log('🔴 [DEBUG] Already checked in');
      return res.json({ valid: false, reason: 'Already checked in' });
    }
    
    const eventDate = new Date(ticket.event_date);
    if (eventDate < new Date()) {
      console.log('🔴 [DEBUG] Event has ended');
      return res.json({ valid: false, reason: 'Event has ended' });
    }
    
    console.log('✅ [DEBUG] Ticket valid');
    res.json({ valid: true, ticket });
  } catch (error) {
    console.error('🔴 [DEBUG] Verification error:', error);
    res.status(500).json({ valid: false, reason: 'Server error' });
  }
});

// Sync blockchain check-in to database
router.post('/sync-checkin', async (req, res) => {
  try {
    console.log('🔵 [DEBUG] Sync check-in request:', req.body);
    const { eventId, attendee, txHash } = req.body;
    
    if (!eventId || !attendee) {
      console.error('🔴 [DEBUG] Missing required fields');
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    const result = db.prepare(`
      UPDATE tickets 
      SET verified = 1, transaction_hash = ?
      WHERE event_id = ? AND LOWER(wallet_address) = LOWER(?)
    `).run(txHash || null, eventId, attendee);
    
    if (result.changes === 0) {
      console.error('🔴 [DEBUG] Ticket not found for update');
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    console.log('✅ [DEBUG] Database synced for check-in:', { eventId, attendee });
    res.json({ success: true });
  } catch (error) {
    console.error('🔴 [DEBUG] Sync check-in error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
