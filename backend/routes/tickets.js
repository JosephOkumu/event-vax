import express from 'express';
import { ethers } from "ethers";
import { TicketNFTABI } from "../../frontend/src/abi/index.js";
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

// Verify/Scan a Ticket QR Code
router.post('/scan', async (req, res) => {
    try {
        const { contractAddress, tokenId, ownerAddress } = req.body;

        if (!contractAddress || tokenId === undefined || !ownerAddress) {
            return res.status(400).json({
                success: false,
                error: 'Invalid QR code. Missing required data.'
            });
        }

        console.log(`🔍 Scanning ticket: Token ID ${tokenId} at Contract ${contractAddress}`);

        // 1. Look up the ticket in the database
        // We match by the owner's address and the tier_id (which maps to the smart contract's token ID)
        const ticket = db.prepare(`
            SELECT t.*, e.event_name 
            FROM tickets t
            JOIN events e ON t.event_id = e.id
            WHERE LOWER(t.wallet_address) = LOWER(?) 
            AND t.tier_id = ?
            AND t.qr_code LIKE ?
        `).get(ownerAddress, tokenId, `%${contractAddress}%`);

        // 2. Ticket not found in our system
        if (!ticket) {
            return res.status(404).json({
                success: false,
                isValid: false,
                error: 'Ticket not found in the database. This QR code may be fake or not from this platform.'
            });
        }

        // 3. Ticket is real, but has it been scanned before?
        if (ticket.is_scanned === 1) {
            return res.status(400).json({
                success: false,
                isValid: false,
                error: 'TICKET ALREADY SCANNED. Entry denied.',
                data: {
                    eventName: ticket.event_name,
                    tokenId: ticket.tier_id,
                    owner: ticket.wallet_address
                }
            });
        }

        // 4. Ticket is real and untouched! Mark it as scanned.
        db.prepare(`
            UPDATE tickets 
            SET is_scanned = 1 
            WHERE id = ?
        `).run(ticket.id);

        console.log(`✅ Ticket #${ticket.id} successfully scanned and marked as used!`);

        return res.json({
            success: true,
            isValid: true,
            message: 'Ticket successfully verified! Entry granted.',
            data: {
                eventName: ticket.event_name,
                tokenId: ticket.tier_id,
                owner: ticket.wallet_address
            }
        });

    } catch (error) {
        console.error('❌ Error scanning ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during verification'
        });
    }
});

export default router;
