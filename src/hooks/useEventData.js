import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { EventManagerABI, TicketNFTABI } from '../abi';
import { CONTRACTS } from '../config/contracts';
import { API_BASE_URL } from '../config/api';

export const useEventData = (eventId) => {
  const [eventData, setEventData] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      
      const backendResponse = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
      const backendResult = await backendResponse.json();
      
      if (!backendResult.success || !backendResult.data) {
        throw new Error('Event not found');
      }

      const backendData = backendResult.data;
      let blockchainSuccess = false;
      
      // Try blockchain first if we have blockchain_event_id
      if (backendData.blockchain_event_id && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const eventManager = new ethers.Contract(CONTRACTS.EVENT_MANAGER, EventManagerABI.abi, provider);
          const details = await eventManager.getEventDetails(backendData.blockchain_event_id);
          const ticketContract = new ethers.Contract(details.ticketContract, TicketNFTABI.abi, provider);
          
          const [eventName, eventDate, totalTickets, soldTickets] = await Promise.all([
            ticketContract.eventName(),
            ticketContract.eventDate(),
            getTotalTickets(ticketContract),
            getSoldTickets(ticketContract)
          ]);

          setEventData({
            id: eventId,
            name: eventName,
            date: new Date(Number(eventDate) * 1000).toLocaleDateString(),
            organizer: details.organizer,
            ticketContract: details.ticketContract,
            totalTickets,
            soldTickets,
            status: getEventStatus(details.state),
            poap: backendData.poap_ipfs_hash ? {
              image: backendData.poap_image_url,
              expiryDate: backendData.poap_expiry,
              supplyType: backendData.poap_supply_type,
              supplyCount: backendData.poap_supply_count,
              minted: backendData.poap_minted || 0
            } : null
          });

          await fetchTicketHolders(ticketContract, backendData.blockchain_event_id);
          blockchainSuccess = true;
        } catch (err) {
          console.warn('Blockchain fetch failed, using backend:', err.message);
        }
      }
      
      // Fallback to backend if blockchain failed or unavailable
      if (!blockchainSuccess) {
        const ticketsResponse = await fetch(`${API_BASE_URL}/api/tickets/event/${eventId}`);
        const ticketsResult = await ticketsResponse.json();
        
        const ticketHolders = ticketsResult.success ? ticketsResult.tickets.map(ticket => ({
          id: ticket.id,
          wallet: `${ticket.wallet_address.slice(0, 6)}...${ticket.wallet_address.slice(-4)}`,
          fullWallet: ticket.wallet_address,
          ticketType: ['Regular', 'VIP', 'VVIP'][ticket.tier_id] || 'Regular',
          checkedIn: ticket.verified || false,
          quantity: ticket.quantity || 1
        })) : [];

        setTickets(ticketHolders);
        
        const totalSold = ticketHolders.reduce((sum, t) => sum + (t.quantity || 1), 0);

        setEventData({
          id: eventId,
          name: backendData.event_name,
          date: new Date(backendData.event_date).toLocaleDateString(),
          organizer: backendData.creator_address,
          ticketContract: null,
          totalTickets: 1000,
          soldTickets: totalSold,
          status: 'Active',
          poap: backendData.poap_ipfs_hash ? {
            image: backendData.poap_image_url,
            expiryDate: backendData.poap_expiry,
            supplyType: backendData.poap_supply_type,
            supplyCount: backendData.poap_supply_count,
            minted: backendData.poap_minted || 0
          } : null
        });
      }
    } catch (err) {
      console.error('Error fetching event data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalTickets = async (contract) => {
    let total = 0;
    for (let i = 0; i < 3; i++) {
      try {
        const tier = await contract.tiers(i);
        if (tier.exists) total += Number(tier.maxSupply);
      } catch { break; }
    }
    return total;
  };

  const getSoldTickets = async (contract) => {
    let sold = 0;
    for (let i = 0; i < 3; i++) {
      try {
        const tier = await contract.tiers(i);
        if (tier.exists) sold += Number(tier.minted);
      } catch { break; }
    }
    return sold;
  };

  const fetchTicketHolders = async (contract, blockchainEventId) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const currentBlock = await provider.getBlockNumber();
      
      // Fetch from backend first (most reliable)
      const ticketsResponse = await fetch(`${API_BASE_URL}/api/tickets/event/${eventId}`);
      const ticketsResult = await ticketsResponse.json();
      
      if (ticketsResult.success && ticketsResult.tickets.length > 0) {
        const holders = ticketsResult.tickets.map(ticket => ({
          id: ticket.id,
          wallet: `${ticket.wallet_address.slice(0, 6)}...${ticket.wallet_address.slice(-4)}`,
          fullWallet: ticket.wallet_address,
          ticketType: ['Regular', 'VIP', 'VVIP'][ticket.tier_id] || 'Regular',
          checkedIn: ticket.verified || false,
          quantity: ticket.quantity || 1
        }));
        setTickets(holders);
        return;
      }
      
      // Fallback: scan blockchain in chunks
      const holders = [];
      const CHUNK_SIZE = 10000;
      const MAX_BLOCKS = 100000;
      const startBlock = Math.max(0, currentBlock - MAX_BLOCKS);
      
      for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += CHUNK_SIZE) {
        const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, currentBlock);
        
        try {
          const filter = contract.filters.TicketPurchased();
          const events = await contract.queryFilter(filter, fromBlock, toBlock);
          
          events.forEach(event => {
            const buyer = event.args.buyer;
            const tierId = Number(event.args.tierId);
            const tierName = ['Regular', 'VIP', 'VVIP'][tierId] || 'Regular';
            
            if (!holders.find(h => h.fullWallet.toLowerCase() === buyer.toLowerCase())) {
              holders.push({
                id: holders.length + 1,
                wallet: `${buyer.slice(0, 6)}...${buyer.slice(-4)}`,
                fullWallet: buyer,
                ticketType: tierName,
                checkedIn: false,
                quantity: 1
              });
            }
          });
        } catch (chunkErr) {
          console.warn(`Chunk ${fromBlock}-${toBlock} failed:`, chunkErr.message);
        }
      }
      
      if (holders.length > 0) setTickets(holders);
    } catch (err) {
      console.warn('Could not fetch ticket holders:', err);
    }
  };

  const getEventStatus = (state) => {
    const states = ['Draft', 'Active', 'Ended', 'Cancelled'];
    return states[state] || 'Active';
  };

  return { eventData, tickets, loading, error, refetch: fetchEventData };
};
