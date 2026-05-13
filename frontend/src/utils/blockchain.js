import { ethers } from 'ethers';
import { EventManagerABI, TicketNFTABI } from '../abi';
import { CONTRACTS, NETWORK } from '../config/contracts';
import { WalletError, ContractError, NetworkError, ValidationError, parseEthersError } from './errors';

// Helper function to determine ticket tier based on price
export const getTicketTierByPrice = (ticketPrice) => {
  const price = parseFloat(ticketPrice);
  if (price <= 0.1) return 0; // Regular
  if (price <= 0.5) return 1; // VIP  
  return 2; // VVIP
};
 
// Validate if event exists and is active
export const validateEventExists = async (eventId) => {
  if (!window.ethereum) {
    throw new WalletError('No wallet detected. Please install MetaMask');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const eventManager = new ethers.Contract(CONTRACTS.EVENT_MANAGER, EventManagerABI.abi, provider);
    const eventDetails = await eventManager.getEventDetails(eventId);
    return eventDetails.ticketContract !== ethers.ZeroAddress;
  } catch (error) {
    const parsed = parseEthersError(error);
    if (parsed.code === 'CALL_EXCEPTION') {
      return false; // Event doesn't exist
    }
    throw new ContractError(`Failed to validate event: ${parsed.message}`, { eventId, originalError: error });
  }
};

// Helper function to check available tiers for an event
export const getAvailableTiers = async (eventId) => {
  if (!window.ethereum) {
    throw new WalletError('No wallet detected. Please install MetaMask');
  }

  if (!eventId || eventId <= 0) {
    throw new ValidationError('Invalid event ID', { eventId });
  }

  try {
    const isValid = await validateEventExists(eventId);
    if (!isValid) {
      console.warn(`Event ${eventId} does not exist or is inactive`);
      return [];
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const eventManager = new ethers.Contract(CONTRACTS.EVENT_MANAGER, EventManagerABI.abi, provider);
    const eventDetails = await eventManager.getEventDetails(eventId);

    const ticketContract = new ethers.Contract(eventDetails.ticketContract, TicketNFTABI.abi, provider);
    const tiers = [];
    
    for (let i = 0; i < 5; i++) {
      try {
        const tier = await ticketContract.tiers(i);
        if (tier.exists) {
          const available = tier.maxSupply - tier.minted;
          tiers.push({
            id: i,
            maxSupply: tier.maxSupply.toString(),
            minted: tier.minted.toString(),
            price: ethers.formatEther(tier.price),
            available: available.toString(),
            isSoldOut: available <= 0n
          });
        }
      } catch (error) {
        break;
      }
    }
    
    return tiers;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof WalletError) {
      throw error;
    }
    const parsed = parseEthersError(error);
    throw new ContractError(`Failed to fetch tiers: ${parsed.message}`, { eventId, originalError: error });
  }
};

export const getValidEventIds = async () => {
  if (!window.ethereum) {
    throw new WalletError('No wallet detected. Please install MetaMask');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const eventManager = new ethers.Contract(CONTRACTS.EVENT_MANAGER, EventManagerABI.abi, provider);
    
    const validIds = [];
    const maxEventId = 20; // Check up to 20 events
    
    for (let i = 1; i <= maxEventId; i++) {
      try {
        const eventDetails = await eventManager.getEventDetails(i);
        if (eventDetails.ticketContract !== ethers.ZeroAddress) {
          validIds.push(i);
        }
      } catch (error) {
        // Event doesn't exist, continue
      }
    }
    
    if (validIds.length === 0) {
      console.warn('No valid events found on the blockchain');
    }
    
    return validIds;
  } catch (error) {
    const parsed = parseEthersError(error);
    throw new ContractError(`Failed to fetch valid events: ${parsed.message}`, { originalError: error });
  }
};

export const mintTicketNFT = async (eventId, tokenURI, ticketPrice) => {
  if (!window.ethereum) {
    throw new WalletError('No wallet detected. Please install MetaMask');
  }

  if (!eventId || eventId <= 0) {
    throw new ValidationError('Invalid event ID', { eventId });
  }

  if (!tokenURI || !tokenURI.trim()) {
    throw new ValidationError('Token URI is required');
  }

  if (!ticketPrice || parseFloat(ticketPrice) <= 0) {
    throw new ValidationError('Invalid ticket price', { ticketPrice });
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    // Check network
    if (network.chainId !== BigInt(NETWORK.CHAIN_ID)) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${NETWORK.CHAIN_ID.toString(16)}` }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          throw new NetworkError('Please add Avalanche network to your wallet');
        }
        throw new NetworkError('Failed to switch network. Please switch manually');
      }
    }

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    
    // Check balance
    const balance = await provider.getBalance(signerAddress);
    const priceInWei = ethers.parseEther(ticketPrice.toString());
    
    if (balance < priceInWei) {
      throw new ValidationError(
        `Insufficient balance. Required: ${ticketPrice} AVAX, Available: ${ethers.formatEther(balance)} AVAX`
      );
    }

    const eventManager = new ethers.Contract(CONTRACTS.EVENT_MANAGER, EventManagerABI.abi, signer);
    
    // Validate event
    const isValid = await validateEventExists(eventId);
    if (!isValid) {
      const validIds = await getValidEventIds();
      if (validIds.length === 0) {
        throw new ValidationError('No valid events available on the blockchain');
      }
      console.warn(`Event ID ${eventId} not found, using event ID ${validIds[0]}`);
      eventId = validIds[0];
    }
    
    const eventDetails = await eventManager.getEventDetails(eventId);
    const ticketContract = new ethers.Contract(eventDetails.ticketContract, TicketNFTABI.abi, signer);
    
    // Get and validate tiers
    const tiers = await getAvailableTiers(eventId);
    if (tiers.length === 0) {
      throw new ValidationError('No ticket tiers available for this event', { eventId });
    }
    
    // Find available tier
    const availableTiers = tiers.filter(t => !t.isSoldOut);
    if (availableTiers.length === 0) {
      throw new ValidationError('All tickets are sold out for this event', { eventId });
    }
    
    // Find best matching tier
    let selectedTier = availableTiers[0];
    for (const tier of availableTiers) {
      const tierPrice = ethers.parseEther(tier.price);
      if (tierPrice <= priceInWei) {
        selectedTier = tier;
      }
    }
    
    const actualPrice = ethers.parseEther(selectedTier.price);
    
    // Estimate gas
    try {
      await ticketContract.purchaseTicket.estimateGas(selectedTier.id, 1, {
        value: actualPrice
      });
    } catch (gasError) {
      const parsed = parseEthersError(gasError);
      throw new ContractError(
        `Transaction will fail: ${parsed.message}`,
        { eventId, tierId: selectedTier.id, reason: parsed.reason }
      );
    }
    
    // Execute transaction
    const tx = await ticketContract.purchaseTicket(selectedTier.id, 1, {
      value: actualPrice,
      gasLimit: 300000 // Set reasonable gas limit
    });

    console.log('Transaction submitted:', tx.hash);
    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
      throw new ContractError('Transaction failed on blockchain', { txHash: tx.hash });
    }

    return tx.hash;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof WalletError || 
        error instanceof NetworkError || error instanceof ContractError) {
      throw error;
    }
    
    const parsed = parseEthersError(error);
    
    if (parsed.userFriendly) {
      throw new ContractError(parsed.message, { code: parsed.code, originalError: error });
    }
    
    throw new ContractError(
      `Failed to purchase ticket: ${parsed.message}`,
      { eventId, originalError: error }
    );
  }
};

/**
 * MetadataRegistry Integration
 */

// Metadata types enum (matches smart contract)
export const MetadataType = {
  Event: 0,
  Ticket: 1,
  POAP: 2,
  Badge: 3
};

/**
 * Register metadata in MetadataRegistry contract
 * @param {number} entityType - MetadataType enum value
 * @param {number} entityId - Entity ID (eventId or tokenId)
 * @param {string} ipfsHash - IPFS CID (without ipfs:// prefix)
 * @param {string} contentHash - SHA256 hash with 0x prefix
 * @returns {Promise<string>} Transaction hash
 */
export const registerMetadata = async (entityType, entityId, ipfsHash, contentHash) => {
  if (!window.ethereum) {
    throw new WalletError('No wallet detected. Please install MetaMask');
  }

  if (!ipfsHash || !contentHash) {
    throw new ValidationError('IPFS hash and content hash are required');
  }

  // Remove ipfs:// prefix if present
  const cleanIpfsHash = ipfsHash.replace('ipfs://', '');

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Import MetadataRegistry ABI
    const { MetadataRegistryABI } = await import('../abi');
    
    const registryContract = new ethers.Contract(
      CONTRACTS.METADATA_REGISTRY,
      MetadataRegistryABI.abi,
      signer
    );

    console.log('📝 Registering metadata:', { entityType, entityId, ipfsHash: cleanIpfsHash });

    const tx = await registryContract.setMetadata(
      entityType,
      entityId,
      cleanIpfsHash,
      contentHash
    );

    console.log('✅ Metadata registration tx:', tx.hash);
    const receipt = await tx.wait();

    if (receipt.status === 0) {
      throw new ContractError('Metadata registration failed on blockchain');
    }

    return tx.hash;
  } catch (error) {
    const parsed = parseEthersError(error);
    throw new ContractError(
      `Failed to register metadata: ${parsed.message}`,
      { entityType, entityId, originalError: error }
    );
  }
};

/**
 * Get metadata from MetadataRegistry
 * @param {number} entityType - MetadataType enum value
 * @param {number} entityId - Entity ID
 * @returns {Promise<Object>} Metadata object
 */
export const getRegisteredMetadata = async (entityType, entityId) => {
  if (!window.ethereum) {
    throw new WalletError('No wallet detected. Please install MetaMask');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const { MetadataRegistryABI } = await import('../abi');
    
    const registryContract = new ethers.Contract(
      CONTRACTS.METADATA_REGISTRY,
      MetadataRegistryABI.abi,
      provider
    );

    const metadata = await registryContract.getMetadata(entityType, entityId);

    return {
      ipfsHash: metadata.ipfsHash,
      contentHash: metadata.contentHash,
      timestamp: Number(metadata.timestamp),
      updatedBy: metadata.updatedBy,
      frozen: metadata.frozen
    };
  } catch (error) {
    const parsed = parseEthersError(error);
    throw new ContractError(
      `Failed to get metadata: ${parsed.message}`,
      { entityType, entityId, originalError: error }
    );
  }
};

/**
 * Verify metadata integrity
 * @param {string} ipfsHash - IPFS CID
 * @param {string} expectedContentHash - Expected SHA256 hash
 * @param {Object} metadata - Metadata object to verify
 * @returns {boolean} True if metadata is valid
 */
export const verifyMetadataIntegrity = (ipfsHash, expectedContentHash, metadata) => {
  try {
    // Calculate hash of metadata
    const metadataString = JSON.stringify(metadata);
    const crypto = window.crypto || window.msCrypto;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(metadataString);
    
    return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex === expectedContentHash;
    });
  } catch (error) {
    console.error('Metadata verification failed:', error);
    return false;
  }
};

/**
 * Freeze metadata (make immutable)
 * @param {number} entityType - MetadataType enum value
 * @param {number} entityId - Entity ID
 * @returns {Promise<string>} Transaction hash
 */
export const freezeMetadata = async (entityType, entityId) => {
  if (!window.ethereum) {
    throw new WalletError('No wallet detected. Please install MetaMask');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const { MetadataRegistryABI } = await import('../abi');
    
    const registryContract = new ethers.Contract(
      CONTRACTS.METADATA_REGISTRY,
      MetadataRegistryABI.abi,
      signer
    );

    const tx = await registryContract.freezeMetadata(entityType, entityId);
    console.log('🔒 Metadata frozen:', tx.hash);
    
    await tx.wait();
    return tx.hash;
  } catch (error) {
    const parsed = parseEthersError(error);
    throw new ContractError(
      `Failed to freeze metadata: ${parsed.message}`,
      { entityType, entityId, originalError: error }
    );
  }
};
