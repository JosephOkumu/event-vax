import { ethers } from 'ethers';
import db from './database.js';
import { CONTRACTS, NETWORK } from '../config/contracts.js';
import { incrementPoapMinted } from './database.js';

const POAP_ABI = [
  'function claimed(uint256 eventId, address attendee) view returns (bool)',
  'function awardPOAP(uint256 eventId, address attendee, bytes32 metadataHash)',
  'function hasRole(bytes32 role, address account) view returns (bool)'
];

const VERIFIER_ROLE = ethers.id('VERIFIER');

class PoapRelayer {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(NETWORK.RPC_URL);
    this.wallet = null;
    this.contract = null;
    this.processing = false;
    this.initialized = false;
    this.initializeWallet();
  }

  initializeWallet() {
    try {
      const privateKey = process.env.RELAYER_PRIVATE_KEY;
      if (!privateKey) {
        console.warn('⚠️  RELAYER_PRIVATE_KEY not set - POAP minting disabled');
        console.warn('💡 Add RELAYER_PRIVATE_KEY to server/.env to enable POAP minting');
        return;
      }

      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(CONTRACTS.POAP, POAP_ABI, this.wallet);
      this.initialized = true;
      console.log('✅ POAP Relayer wallet initialized:', this.wallet.address);
    } catch (error) {
      console.error('❌ Failed to initialize relayer wallet:', error.message);
    }
  }

  async checkVerifierRole() {
    if (!this.initialized) return false;
    try {
      const hasRole = await this.contract.hasRole(VERIFIER_ROLE, this.wallet.address);
      if (!hasRole) {
        console.warn('⚠️  Relayer does not have VERIFIER_ROLE on POAP contract');
        console.warn('💡 Grant VERIFIER_ROLE to', this.wallet.address);
      }
      return hasRole;
    } catch (error) {
      console.error('Failed to check verifier role:', error.message);
      return false;
    }
  }

  async processPendingRequests() {
    if (this.processing || !this.initialized) return;
    this.processing = true;

    try {
      const pending = db.prepare(
        `SELECT pr.*, e.blockchain_event_id, e.id as db_event_id
         FROM poap_requests pr 
         JOIN events e ON pr.event_id = e.blockchain_event_id 
         WHERE pr.status = ? AND pr.retry_count < 3
         LIMIT 5`
      ).all('pending');

      if (pending.length > 0) {
        console.log(`📋 Processing ${pending.length} pending POAP requests...`);
      }

      for (const request of pending) {
        await this.processRequest(request);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error('Relayer error:', error.message);
    } finally {
      this.processing = false;
    }
  }

  async processRequest(request) {
    try {
      const claimed = await this.contract.claimed(request.event_id, request.wallet_address);
      
      if (claimed) {
        db.prepare('UPDATE poap_requests SET status = ? WHERE id = ?')
          .run('issued', request.id);
        console.log(`✅ POAP already claimed for ${request.wallet_address}`);
        return;
      }

      const metadataHash = ethers.id(`poap-${request.event_id}-${request.wallet_address}-${Date.now()}`);
      
      console.log(`🔄 Minting POAP for ${request.wallet_address.slice(0, 6)}...${request.wallet_address.slice(-4)}`);
      const tx = await this.contract.awardPOAP(
        request.event_id,
        request.wallet_address,
        metadataHash,
        { gasLimit: 300000 }
      );

      db.prepare('UPDATE poap_requests SET status = ?, tx_hash = ? WHERE id = ?')
        .run('processing', tx.hash, request.id);

      console.log(`⏳ Waiting for confirmation: ${tx.hash}`);
      await tx.wait();

      db.prepare('UPDATE poap_requests SET status = ? WHERE id = ?')
        .run('issued', request.id);

      if (request.db_event_id) {
        incrementPoapMinted(request.db_event_id);
      }

      console.log(`✅ POAP minted: Event ${request.event_id}, User ${request.wallet_address.slice(0, 6)}...${request.wallet_address.slice(-4)}`);
    } catch (error) {
      console.error(`❌ Failed to mint POAP for ${request.wallet_address}:`, error.message);
      
      const retries = request.retry_count || 0;
      if (retries < 3) {
        db.prepare('UPDATE poap_requests SET retry_count = ?, error = ? WHERE id = ?')
          .run(retries + 1, error.message.slice(0, 500), request.id);
      } else {
        db.prepare('UPDATE poap_requests SET status = ?, error = ? WHERE id = ?')
          .run('failed', error.message.slice(0, 500), request.id);
      }
    }
  }

  start() {
    if (!this.initialized) {
      console.log('⚠️  POAP Relayer not started - missing configuration');
      return;
    }

    console.log('🚀 POAP Relayer started - checking every 30 seconds');
    this.processPendingRequests();
    setInterval(() => this.processPendingRequests(), 30000);
  }
}

export default PoapRelayer;
