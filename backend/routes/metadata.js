import express from 'express';
import { uploadMetadataToIPFS, uploadImageToIPFS, generateContentHash, base64ToBuffer } from '../utils/ipfs.js';

const router = express.Router();

/**
 * Upload POAP/Badge metadata to IPFS
 * Only POAPs and Badges use IPFS storage
 */
router.post('/upload', async (req, res) => {
    try {
        const { metadata, type, image } = req.body;

        if (!metadata) {
            return res.status(400).json({
                success: false,
                error: 'Metadata is required'
            });
        }

        // Validate type is POAP or Badge only
        if (type !== 'POAP' && type !== 'Badge') {
            return res.status(400).json({
                success: false,
                error: 'Only POAP and Badge metadata can be uploaded to IPFS'
            });
        }

        let ipfsImageHash = null;

        // Upload image to IPFS if provided
        if (image) {
            try {
                console.log(`📤 Uploading ${type} image to IPFS...`);
                const imageBuffer = base64ToBuffer(image);
                const filename = `${type}-${Date.now()}.jpg`;
                ipfsImageHash = await uploadImageToIPFS(imageBuffer, filename);
                console.log('✅ Image IPFS hash:', ipfsImageHash);
                
                // Update metadata with IPFS image
                metadata.image = `ipfs://${ipfsImageHash}`;
            } catch (error) {
                console.warn('⚠️ IPFS image upload failed:', error.message);
            }
        }

        // Upload metadata to IPFS
        console.log(`📤 Uploading ${type} metadata to IPFS...`);
        const ipfsHash = await uploadMetadataToIPFS(
            metadata,
            `${type}-metadata-${Date.now()}.json`
        );

        // Generate content hash for verification
        const contentHash = generateContentHash(metadata);

        console.log('✅ Metadata uploaded:', { ipfsHash, contentHash });

        res.json({
            success: true,
            ipfsHash,
            ipfsImageHash,
            contentHash,
            ipfsUri: `ipfs://${ipfsHash}`
        });
    } catch (error) {
        console.error('❌ Metadata upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload metadata to IPFS',
            details: error.message
        });
    }
});

/**
 * Fetch metadata from IPFS
 */
router.get('/:ipfsHash', async (req, res) => {
    try {
        const { ipfsHash } = req.params;
        
        const gateways = [
            `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
            `https://ipfs.io/ipfs/${ipfsHash}`,
            `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`
        ];

        for (const gateway of gateways) {
            try {
                const response = await fetch(gateway, { timeout: 5000 });
                if (response.ok) {
                    const data = await response.json();
                    return res.json({ success: true, data });
                }
            } catch (error) {
                continue;
            }
        }

        res.status(404).json({
            success: false,
            error: 'Failed to fetch from all IPFS gateways'
        });
    } catch (error) {
        console.error('IPFS fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch metadata',
            details: error.message
        });
    }
});

export default router;
