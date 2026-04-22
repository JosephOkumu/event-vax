/**
 * Phase 3: Blockchain Minting Service
 *
 * After M-Pesa payment is confirmed (KES), this service:
 * 1. Connects to Avalanche Fuji testnet via RPC
 * 2. Uses the PLATFORM ADMIN wallet to pay AVAX gas fees
 * 3. Calls purchaseTicket() on the event's TicketNFT contract
 *    on behalf of the user's custodial wallet address
 * 4. Returns the tokenId and txHash for storage
 *
 * Currency model:
 *   User pays:   KES (M-Pesa STK Push)
 *   Gas fees:    AVAX (Platform admin wallet — never the user)
 *   NFT owner:   User's custodial wallet address
 */

const { ethers } = require('ethers');

// ── Contract addresses (Fuji Testnet) ───────────────────────────────────────
const CONTRACTS = {
    EVENT_FACTORY: '0x53687CccF774FDa60fE2bd4720237fbb8e4fd02c',
};

const NETWORK = {
    RPC_URL: process.env.AVALANCHE_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
};

// ── Minimal ABIs (only what we need) ────────────────────────────────────────

const EVENT_FACTORY_ABI = [
    'function eventTicket(uint256 eventId) external view returns (address)',
];

const TICKET_NFT_ABI = [
    // purchaseTicket with native AVAX payment
    'function purchaseTicket(uint256 tierId, uint256 amount) external payable',
    // tiers to get the price
    'function tiers(uint256 tierId) external view returns (uint256 maxSupply, uint256 minted, uint256 price, bool exists)',
    // balance check
    'function balanceOf(address account, uint256 id) external view returns (uint256)',
    // events
    'event TicketPurchased(address indexed buyer, uint256 indexed tierId, uint256 amount, address token)',
];

/**
 * Get an ethers provider connected to Fuji.
 */
function getProvider() {
    return new ethers.JsonRpcProvider(NETWORK.RPC_URL);
}

/**
 * Get the platform admin signer (pays AVAX gas fees).
 * Uses PLATFORM_ADMIN_PRIVATE_KEY from .env
 */
function getAdminSigner() {
    const adminKey = process.env.PLATFORM_ADMIN_PRIVATE_KEY;
    if (!adminKey) throw new Error('PLATFORM_ADMIN_PRIVATE_KEY is not set in .env');
    const provider = getProvider();
    return new ethers.Wallet(adminKey, provider);
}

/**
 * Get the TicketNFT contract address for a given on-chain eventId.
 */
async function getTicketContractAddress(onChainEventId) {
    const provider = getProvider();
    const factory = new ethers.Contract(CONTRACTS.EVENT_FACTORY, EVENT_FACTORY_ABI, provider);
    const ticketAddress = await factory.eventTicket(BigInt(onChainEventId));
    if (!ticketAddress || ticketAddress === ethers.ZeroAddress) {
        throw new Error(`No TicketNFT found for eventId ${onChainEventId}`);
    }
    return ticketAddress;
}

/**
 * Mint a ticket NFT for a USSD user.
 *
 * The platform admin wallet calls purchaseTicket() and pays the AVAX price.
 * The NFT is then transferred to the user's custodial wallet.
 *
 * @param {object} params
 * @param {string} params.walletAddress   - User's custodial wallet address (NFT owner)
 * @param {string} params.eventId         - SQLite event_id (maps to on-chain eventId)
 * @param {string} params.ticketCode      - USSD ticket code (stored in SQLite)
 * @param {number} params.amountKes       - KES already paid (for logging only)
 * @param {number} [params.tierId=0]      - Ticket tier (0 = Regular)
 * @returns {{ tokenId: string, txHash: string, walletAddress: string }}
 */
async function mintTicketOnChain({ walletAddress, eventId, ticketCode, amountKes, tierId = 0 }) {
    console.log(`\n🔗 [mintService] Minting ticket for ${walletAddress} | event ${eventId} | tier ${tierId}`);
    console.log(`   KES paid: ${amountKes} | USSD code: ${ticketCode}`);

    const adminSigner = getAdminSigner();
    const adminAddress = await adminSigner.getAddress();
    const provider = getProvider();

    // Get the TicketNFT contract for this event
    const ticketAddress = await getTicketContractAddress(eventId);
    console.log(`   TicketNFT contract: ${ticketAddress}`);

    const ticketContract = new ethers.Contract(ticketAddress, TICKET_NFT_ABI, adminSigner);

    // Get the tier price (in wei / AVAX)
    const tierInfo = await ticketContract.tiers(BigInt(tierId));
    if (!tierInfo.exists) {
        throw new Error(`Tier ${tierId} does not exist on contract ${ticketAddress}`);
    }
    const priceWei = tierInfo.price;
    console.log(`   Tier ${tierId} price: ${ethers.formatEther(priceWei)} AVAX`);

    // Check admin balance
    const adminBalance = await provider.getBalance(adminAddress);
    console.log(`   Admin wallet balance: ${ethers.formatEther(adminBalance)} AVAX`);

    // ── Call purchaseTicket() as admin, sending priceWei in AVAX ────────────
    // The NFT will be minted to the ADMIN's address first,
    // then we transfer it to the user's custodial wallet.
    const tx = await ticketContract.purchaseTicket(BigInt(tierId), BigInt(1), {
        value: priceWei,
        gasLimit: 300000,
    });

    console.log(`   Tx submitted: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`   ✅ Tx confirmed in block ${receipt.blockNumber}`);

    // Parse the TicketPurchased event to get the tokenId (= tierId in ERC1155)
    // In this ERC1155, the tokenId IS the tierId
    const tokenId = tierId.toString();
    const txHash = receipt.hash;

    // ── Transfer NFT from admin to user's custodial wallet ──────────────────
    // ERC1155 safeTransferFrom(from, to, id, amount, data)
    const erc1155ABI = [
        'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) external',
        'function balanceOf(address account, uint256 id) external view returns (uint256)',
    ];
    const transferContract = new ethers.Contract(ticketAddress, erc1155ABI, adminSigner);

    console.log(`   Transferring token ${tokenId} → ${walletAddress}...`);
    const transferTx = await transferContract.safeTransferFrom(
        adminAddress,
        walletAddress,
        BigInt(tokenId),
        BigInt(1),
        '0x'
    );
    const transferReceipt = await transferTx.wait();
    console.log(`   ✅ Transfer confirmed: ${transferReceipt.hash}`);

    return {
        tokenId,
        txHash,
        transferTxHash: transferReceipt.hash,
        walletAddress,
        ticketAddress,
    };
}

module.exports = {
    mintTicketOnChain,
    getTicketContractAddress,
};
