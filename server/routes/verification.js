import express from 'express';
import db from '../utils/database.js';

const router = express.Router();

// Quick pre-validation before blockchain call
router.post('/verify-quick', async (req, res) => {
  try {
    const { eventId, attendee } = req.body;
    
    const ticket = db.prepare(`
      SELECT t.*, e.event_date 
      FROM tickets t
      LEFT JOIN events e ON t.event_id = e.id
      WHERE t.event_id = ? AND LOWER(t.wallet_address) = LOWER(?)
    `).get(eventId, attendee);
    
    if (!ticket) {
      return res.json({ valid: false, reason: 'Ticket not found' });
    }
    
    if (ticket.checked_in) {
      return res.json({ valid: false, reason: 'Already checked in' });
    }
    
    const eventDate = new Date(ticket.event_date);
    if (eventDate < new Date()) {
      return res.json({ valid: false, reason: 'Event has ended' });
    }
    
    res.json({ valid: true, ticket });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ valid: false, reason: 'Server error' });
  }
});

// Mark ticket as checked in (called after blockchain verification)
router.post('/mark-checkin', async (req, res) => {
  try {
    const { eventId, attendee, txHash } = req.body;
    
    db.prepare(`
      UPDATE tickets 
      SET verified = 1, transaction_hash = ?
      WHERE event_id = ? AND LOWER(wallet_address) = LOWER(?)
    `).run(txHash, eventId, attendee);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark check-in error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
