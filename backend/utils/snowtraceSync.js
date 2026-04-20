import { ethers } from 'ethers';
import db from './database.js';

const EVENT_MANAGER = '0x1651f730a846eD23411180eC71C9eFbFCD05A871';
const METADATA_REGISTRY = '0xB8F60EAf784b897F7b7AFDabdc67aC6E69fA953b';
const SNOWTRACE_API = 'https://api-testnet.snowtrace.io/api';
const RPC_URL = 'https://api.avax-test.network/ext/bc/C/rpc';

const METADATA_ABI = ['function getMetadata(uint8 entityType, uint256 entityId) view returns (tuple(string ipfsHash, bytes32 contentHash, uint256 timestamp, address updatedBy, bool frozen))'];

async function fetchMetadataFromIPFS(ipfsHash) {
    try {
        const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch IPFS metadata: ${error.message}`);
        return null;
    }
}

export async function syncEventsFromBlockchain() {
    try {
        const eventTopic = ethers.id('EventRegistered(uint256,address,address,uint256,uint256)');
        const url = `${SNOWTRACE_API}?module=logs&action=getLogs&address=${EVENT_MANAGER}&topic0=${eventTopic}&fromBlock=0&toBlock=latest&apikey=${process.env.SNOWTRACE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status !== '1' || !data.result.length) return;
        
        const iface = new ethers.Interface(['event EventRegistered(uint256 indexed eventId, address indexed organizer, address ticketContract, uint256 startTime, uint256 endTime)']);
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const metadataRegistry = new ethers.Contract(METADATA_REGISTRY, METADATA_ABI, provider);
        let synced = 0;
        
        for (const log of data.result) {
            const parsed = iface.parseLog({ topics: log.topics, data: log.data });
            const eventId = Number(parsed.args.eventId);
            
            if (!db.prepare('SELECT id FROM events WHERE blockchain_event_id = ?').get(eventId)) {
                let eventName = `Event #${eventId}`;
                let venue = 'Blockchain Event';
                let imageUrl = null;
                
                try {
                    const metadata = await metadataRegistry.getMetadata(0, eventId); // 0 = MetadataType.Event
                    if (metadata.ipfsHash) {
                        const ipfsData = await fetchMetadataFromIPFS(metadata.ipfsHash);
                        if (ipfsData) {
                            eventName = ipfsData.name || eventName;
                            venue = ipfsData.location || venue;
                            imageUrl = ipfsData.image || null;
                        }
                    }
                } catch (err) {
                    console.log(`⚠️  No metadata for event ${eventId}`);
                }
                
                db.prepare('INSERT INTO events (event_name, event_date, venue, creator_address, blockchain_event_id, blockchain_tx_hash, flyer_image) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
                    eventName,
                    new Date(Number(parsed.args.startTime) * 1000).toISOString(),
                    venue,
                    parsed.args.organizer,
                    eventId,
                    log.transactionHash,
                    imageUrl
                );
                synced++;
            }
        }
        
        if (synced > 0) console.log(`✅ Synced ${synced} new events from blockchain`);
    } catch (error) {
        console.error('❌ Blockchain sync failed:', error.message);
    }
}
