import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_JWT = process.env.PINATA_SECRET_JWT;

/**
 * Upload image buffer to IPFS via Pinata
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} filename - Original filename
 * @returns {Promise<string>} IPFS hash (CID)
 */
export const uploadImageToIPFS = async (imageBuffer, filename) => {
    if (!PINATA_JWT) {
        throw new Error('PINATA_SECRET_JWT not configured in .env');
    }

    const FormData = (await import('form-data')).default;
    const form = new FormData();
    
    form.append('file', imageBuffer, {
        filename: filename,
        contentType: 'image/*'
    });

    const metadata = JSON.stringify({
        name: filename,
        keyvalues: {
            type: 'event-flyer',
            timestamp: Date.now().toString()
        }
    });
    form.append('pinataMetadata', metadata);

    const options = JSON.stringify({
        cidVersion: 1
    });
    form.append('pinataOptions', options);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: form
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pinata upload failed: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Image uploaded to IPFS:', data.IpfsHash);
    return data.IpfsHash; // Returns CID without ipfs:// prefix
};

/**
 * Upload JSON metadata to IPFS via Pinata
 * @param {Object} metadata - Metadata object
 * @param {string} name - Metadata name
 * @returns {Promise<string>} IPFS hash (CID)
 */
export const uploadMetadataToIPFS = async (metadata, name) => {
    if (!PINATA_JWT) {
        throw new Error('PINATA_SECRET_JWT not configured in .env');
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: JSON.stringify({
            pinataContent: metadata,
            pinataMetadata: {
                name: name,
                keyvalues: {
                    type: 'metadata',
                    timestamp: Date.now().toString()
                }
            },
            pinataOptions: {
                cidVersion: 1
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pinata metadata upload failed: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Metadata uploaded to IPFS:', data.IpfsHash);
    return data.IpfsHash;
};

/**
 * Generate SHA256 content hash for verification
 * @param {Object|string} content - Content to hash
 * @returns {string} Hex string of SHA256 hash (with 0x prefix)
 */
export const generateContentHash = (content) => {
    const contentString = typeof content === 'string' 
        ? content 
        : JSON.stringify(content);
    
    const hash = crypto
        .createHash('sha256')
        .update(contentString)
        .digest('hex');
    
    return '0x' + hash;
};

/**
 * Convert base64 image to buffer
 * @param {string} base64String - Base64 encoded image
 * @returns {Buffer} Image buffer
 */
export const base64ToBuffer = (base64String) => {
    // Remove data:image/...;base64, prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
};

/**
 * Fetch metadata from IPFS with fallback
 * @param {string} ipfsHash - IPFS CID
 * @returns {Promise<Object>} Metadata object
 */
export const fetchFromIPFS = async (ipfsHash) => {
    const gateways = [
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        `https://ipfs.io/ipfs/${ipfsHash}`,
        `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`
    ];

    for (const gateway of gateways) {
        try {
            const response = await fetch(gateway, { timeout: 5000 });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn(`Gateway ${gateway} failed:`, error.message);
        }
    }

    throw new Error('All IPFS gateways failed');
};
