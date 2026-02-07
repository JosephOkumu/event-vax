import express from 'express';
import { ethers } from "ethers";
import { TicketNFTABI } from "../../src/abi/index.js";
import db from '../utils/database.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const AVALANCHE_RPC = process.env.AVALANCHE_RPC || 'https://api.avax-test.network/ext/bc/C/rpc';

router.post('/', async (req, res) => {
    try {
        const { transactionHash, walletAddress, ticketContractAddress, eventId, tierId, quantity } = req.body;

        console.log('📥 Saving ticket:', { eventId, walletAddress, quantity, transactionHash });

        // Generate QR code with on-chain verifiable data
        const qrData = {
            contractAddress: ticketContractAddress,
            tokenId: tierId,
            owner: walletAddress,
            eventId: eventId
        };

        // Save to database immediately (frontend already verified blockchain)
        const result = db.prepare(`
            INSERT INTO tickets (event_id, wallet_address, tier_id, quantity, qr_code, transaction_hash, verified)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            eventId,
            walletAddress,
            tierId,
            quantity,
            JSON.stringify(qrData),
            transactionHash,
            1
        );

        console.log('✅ Ticket saved with ID:', result.lastInsertRowid);
        
        // Send immediate response
        res.json({ success: true, ticketId: result.lastInsertRowid });

        // Background verification (doesn't block response)
        setImmediate(async () => {
            try {
                console.log('🔍 Background verification started for:', transactionHash);
                const provider = new ethers.JsonRpcProvider(AVALANCHE_RPC);
                const receipt = await provider.getTransactionReceipt(transactionHash);

                if (!receipt || receipt.status !== 1) {
                    console.warn('⚠️ Transaction verification failed:', transactionHash);
                    db.prepare('UPDATE tickets SET verified = 0 WHERE transaction_hash = ?').run(transactionHash);
                    return;
                }

                const contract = new ethers.Contract(ticketContractAddress, TicketNFTABI.abi, provider);
                const balance = await contract.balanceOf(walletAddress, tierId);

                if (balance < quantity) {
                    console.warn('⚠️ Ownership verification failed:', { walletAddress, tierId, balance, quantity });
                    db.prepare('UPDATE tickets SET verified = 0 WHERE transaction_hash = ?').run(transactionHash);
                } else {
                    console.log('✅ Background verification passed:', transactionHash);
                }
            } catch (error) {
                console.error('❌ Background verification error:', error.message);
            }
        });

    } catch (error) {
        console.error('❌ Error saving ticket:', error);
        res.status(500).json({ success: false, error: 'Failed to save ticket', details: error.message });
    }
});

// Get tickets by wallet address
router.get('/wallet/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        
        const tickets = db.prepare(`
            SELECT t.*, e.event_name, e.event_date, e.venue, e.flyer_image, e.description
            FROM tickets t
            LEFT JOIN events e ON t.event_id = e.id
            WHERE t.wallet_address = ?
            ORDER BY t.created_at DESC
        `).all(walletAddress);

        res.json({ success: true, tickets });
    } catch (error) {
        console.error('❌ Error fetching tickets:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
    }
});

// Get tickets by event ID
router.get('/event/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const tickets = db.prepare(`
            SELECT t.*, e.event_name
            FROM tickets t
            LEFT JOIN events e ON t.event_id = e.id
            WHERE t.event_id = ?
            ORDER BY t.created_at DESC
        `).all(eventId);

        res.json({ success: true, tickets });
    } catch (error) {
        console.error('❌ Error fetching event tickets:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch event tickets' });
    }
});

// Update ticket check-in status
router.patch('/:ticketId/checkin', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { checkedIn } = req.body;
        
        db.prepare('UPDATE tickets SET verified = ? WHERE id = ?')
          .run(checkedIn ? 1 : 0, ticketId);

        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error updating check-in:', error);
        res.status(500).json({ success: false, error: 'Failed to update check-in' });
    }
});

export default router;
