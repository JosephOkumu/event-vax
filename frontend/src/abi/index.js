import EventFactoryABI from './EventFactory.json' with { type: 'json' };
import MarketplaceABI from './Marketplace.json' with { type: 'json' };
import EventManagerABI from './EventManager.json' with { type: 'json' };
import QRVerificationABI from './QRVerificationSystem.json' with { type: 'json' };
import TicketNFTABI from './TicketNFT.json' with { type: 'json' };
import POAPABI from './POAP.json' with { type: 'json' };
import EventBadgeABI from './EventBadge.json' with { type: 'json' };
import MetadataRegistryABI from './MetadataRegistry.json' with { type: 'json' };

export {
  EventFactoryABI,
  MarketplaceABI,
  EventManagerABI,
  QRVerificationABI,
  TicketNFTABI,
  POAPABI,
  EventBadgeABI,
  MetadataRegistryABI
};

// Extract just the ABI arrays for direct use
export const EventFactory = EventFactoryABI.abi;
export const Marketplace = MarketplaceABI.abi;
export const EventManager = EventManagerABI.abi;
export const QRVerification = QRVerificationABI.abi;
export const TicketNFT = TicketNFTABI.abi;
export const POAP = POAPABI.abi;
export const EventBadge = EventBadgeABI.abi;
export const MetadataRegistry = MetadataRegistryABI.abi;
