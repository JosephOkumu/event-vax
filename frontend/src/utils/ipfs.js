// IPFS Upload Utility using Pinata
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY || '';

export const uploadToIPFS = async (metadata) => {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('Pinata API keys not configured. Set VITE_PINATA_API_KEY and VITE_PINATA_SECRET_KEY in .env');
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `${metadata.name}-metadata.json`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to upload to IPFS');
  }

  const data = await response.json();
  return `ipfs://${data.IpfsHash}`;
};
