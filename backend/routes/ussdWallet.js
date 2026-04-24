/**
 * Phase 5 - Backend: USSD Wallet Linking Routes
 *
 * Exposes three endpoints:
 *
 *  GET  /api/ussd-tickets/phone/:phoneNumber
 *    → Returns all USSD tickets for a phone number (no auth, safe — no private keys)
 *
 *  POST /api/ussd-tickets/link/request-otp
 *    → Sends an OTP SMS to the phone number so user can prove ownership
 *
 *  POST /api/ussd-tickets/link/verify
 *    → Verifies OTP, then transfers all custodial NFTs to the user's Core wallet
 */

import express from 'express';
import { ethers } from 'ethers';
import { createRequire } from 'module';
import dotenv from 'dotenv';
dotenv.config();

const require = createRequire(import.meta.url);

// CJS utils (USSD services use CommonJS)
const ussdDb = require('../utils/ussd_db.cjs');
const walletManager = require('../utils/walletManager.cjs');
const smsService = require('../utils/smsService.cjs');

const router = express.Router();

// In-memory OTP store (per phone → { otp, expiresAt, coreWallet })
const otpStore = new Map();

const AVALANCHE_RPC = process.env.AVALANCHE_RPC_URL ||
    process.env.AVALANCHE_RPC ||
    'https://api.avax-test.network/ext/bc/C/rpc';

// Minimal ERC1155 ABI for transfer
const ERC1155_ABI = [
    'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) external',
    'function balanceOf(address account, uint256 id) external view returns (uint256)',
];

// ── GET /phone/:phoneNumber ──────────────────────────────────────────────────
// Returns USSD tickets for a phone number so the website can display them.
router.get('/phone/:phoneNumber', (req, res) => {
    try {
        const phone = decodeURIComponent(req.params.phoneNumber);
        const tickets = ussdDb.findTicketsByPhone(phone);

        const wallet = walletManager.getWalletByPhone(phone);

        res.json({
            success: true,
            phone,
            walletAddress: wallet ? wallet.address : null,
            tickets: tickets.map(t => ({
                id: t.id,
                ticketCode: t.ticket_code,
                eventId: t.event_id,
                eventName: t.event_name,
                price: t.price,
                status: t.status,
                mintStatus: t.mint_status,
                tokenId: t.token_id,
                txHash: t.tx_hash,
                createdAt: t.created_at,
            })),
        });
    } catch (err) {
        console.error('Error fetching USSD tickets by phone:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── POST /link/request-otp ───────────────────────────────────────────────────
// Sends a 6-digit OTP to the phone to initiate wallet linking.
router.post('/link/request-otp', async (req, res) => {
    try {
        const { phoneNumber, coreWalletAddress } = req.body;

        if (!phoneNumber || !coreWalletAddress) {
            return res.status(400).json({ success: false, error: 'phoneNumber and coreWalletAddress are required' });
        }

        // Check if the phone has any USSD tickets
        const tickets = ussdDb.findTicketsByPhone(phoneNumber);
        if (tickets.length === 0) {
            return res.status(404).json({ success: false, error: 'No USSD tickets found for this phone number' });
        }

        // Generate a 6-digit OTP, valid for 10 minutes
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(phoneNumber, {
            otp,
            coreWalletAddress,
            expiresAt: Date.now() + 10 * 60 * 1000,
        });

        await smsService.sendOTPSMS(phoneNumber, otp);

        console.log(`📱 OTP sent to ${phoneNumber}: ${otp} (dev log — remove in prod)`);

        res.json({ success: true, message: 'OTP sent to your phone number.' });
    } catch (err) {
        console.error('Error sending OTP:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── POST /link/verify ────────────────────────────────────────────────────────
// Verifies OTP and transfers all minted NFTs from custodial wallet to Core wallet.
router.post('/link/verify', async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ success: false, error: 'phoneNumber and otp are required' });
        }

        const record = otpStore.get(phoneNumber);
        if (!record) {
            return res.status(400).json({ success: false, error: 'No OTP found. Please request a new one.' });
        }
        if (Date.now() > record.expiresAt) {
            otpStore.delete(phoneNumber);
            return res.status(400).json({ success: false, error: 'OTP expired. Please request a new one.' });
        }
        if (record.otp !== otp.trim()) {
            return res.status(400).json({ success: false, error: 'Invalid OTP.' });
        }

        // OTP is valid — clear it
        otpStore.delete(phoneNumber);
        const coreWalletAddress = record.coreWalletAddress;

        // Get the custodial wallet private key for this phone
        const custodialWallet = walletManager.getWalletByPhone(phoneNumber);
        if (!custodialWallet) {
            return res.status(404).json({ success: false, error: 'No custodial wallet found for this phone.' });
        }

        const provider = new ethers.JsonRpcProvider(AVALANCHE_RPC);
        const signer = new ethers.Wallet(custodialWallet.privateKey, provider);

        // Get all minted tickets for this phone
        const tickets = ussdDb.findTicketsByPhone(phoneNumber).filter(
            t => t.mint_status === 'minted' && t.token_id != null
        );

        const transferResults = [];

        for (const ticket of tickets) {
            try {
                // We need the ticket contract address — stored in tx_hash or looked up
                // The eventId maps to the on-chain event; we need the contract address.
                // For now we read it from events.db via a join (the ussd_eventService knows this).
                // We'll get it from the tx_hash receipt's `to` field.
                const receipt = await provider.getTransactionReceipt(ticket.tx_hash);
                if (!receipt) {
                    transferResults.push({ ticketCode: ticket.ticket_code, status: 'skipped_no_receipt' });
                    continue;
                }

                const contractAddress = receipt.to;
                const contract = new ethers.Contract(contractAddress, ERC1155_ABI, signer);

                const balance = await contract.balanceOf(custodialWallet.address, BigInt(ticket.token_id));
                if (balance === 0n) {
                    transferResults.push({ ticketCode: ticket.ticket_code, status: 'skipped_no_balance' });
                    continue;
                }

                const tx = await contract.safeTransferFrom(
                    custodialWallet.address,
                    coreWalletAddress,
                    BigInt(ticket.token_id),
                    1n,
                    '0x'
                );
                const txReceipt = await tx.wait();

                transferResults.push({
                    ticketCode: ticket.ticket_code,
                    eventName: ticket.event_name,
                    status: 'transferred',
                    txHash: txReceipt.hash,
                });

                console.log(`✅ Transferred ticket ${ticket.ticket_code} → ${coreWalletAddress}`);
            } catch (txErr) {
                console.error(`❌ Transfer failed for ${ticket.ticket_code}:`, txErr.message);
                transferResults.push({ ticketCode: ticket.ticket_code, status: 'failed', error: txErr.message });
            }
        }

        res.json({
            success: true,
            message: `Wallet linked! ${transferResults.filter(r => r.status === 'transferred').length} ticket(s) transferred to your Core wallet.`,
            coreWallet: coreWalletAddress,
            transferResults,
        });

    } catch (err) {
        console.error('Error verifying OTP / linking wallet:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
