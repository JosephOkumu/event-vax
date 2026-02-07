import express from 'express';
import db from '../utils/database.js';

const router = express.Router();

router.post('/request', async (req, res) => {
  const { eventId, walletAddress } = req.body;

  try {
    const existing = db.prepare(
      'SELECT * FROM poap_requests WHERE event_id = ? AND wallet_address = ?'
    ).get(eventId, walletAddress);

    if (existing) {
      return res.json({ 
        success: true, 
        status: existing.status,
        message: existing.status === 'issued' ? 'POAP already issued' : 'Request pending'
      });
    }

    db.prepare(
      'INSERT INTO poap_requests (event_id, wallet_address, status) VALUES (?, ?, ?)'
    ).run(eventId, walletAddress, 'pending');

    res.json({ success: true, status: 'pending' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status/:eventId/:walletAddress', (req, res) => {
  const { eventId, walletAddress } = req.params;

  const request = db.prepare(
    'SELECT status, tx_hash, created_at FROM poap_requests WHERE event_id = ? AND wallet_address = ?'
  ).get(eventId, walletAddress);

  res.json({ 
    success: true, 
    status: request?.status || 'not_requested',
    txHash: request?.tx_hash,
    requestedAt: request?.created_at
  });
});

export default router;
