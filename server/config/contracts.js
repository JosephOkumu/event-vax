import dotenv from 'dotenv';

dotenv.config();

export const CONTRACTS = {
  TICKET_NFT_IMPLEMENTATION: process.env.TICKET_NFT_IMPLEMENTATION,
  EVENT_MANAGER: process.env.EVENT_MANAGER,
  MARKETPLACE: process.env.MARKETPLACE,
  EVENT_FACTORY: process.env.EVENT_FACTORY,
  QR_VERIFICATION_SYSTEM: process.env.QR_VERIFICATION_SYSTEM,
  POAP: process.env.POAP,
  EVENT_BADGE: process.env.EVENT_BADGE,
  METADATA_REGISTRY: process.env.METADATA_REGISTRY
};

export const NETWORK = {
  RPC_URL: process.env.AVALANCHE_RPC,
  CHAIN_ID: 43113,
  NAME: 'Avalanche Fuji Testnet',
  EXPLORER: 'https://testnet.snowtrace.io'
};
