import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { EventManagerABI, TicketNFTABI } from '../abi';
import { CONTRACTS } from '../config/contracts';

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
      const provider = new ethers.BrowserProvider(window.ethereum);
      const eventManager = new ethers.Contract(CONTRACTS.EVENT_MANAGER, EventManagerABI.abi, provider);
      
      const details = await eventManager.getEventDetails(eventId);
      const ticketContract = new ethers.Contract(details.ticketContract, TicketNFTABI.abi, provider);
      
      const [eventName, eventDate, totalTickets, soldTickets] = await Promise.all([
        ticketContract.eventName(),
        ticketContract.eventDate(),
        getTotalTickets(ticketContract),
        getSoldTickets(ticketContract)
      ]);

      // Fetch POAP data from backend
      let poapData = null;
      try {
        const response = await fetch(`http://localhost:8080/api/events/${eventId}`);
        const result = await response.json();
        console.log('🎯 POAP API Response:', result);
        
        if (result.success && result.data) {
          const data = result.data;
          console.log('🔍 Checking POAP fields:', {
            has_ipfs_hash: !!data.poap_ipfs_hash,
            has_content_hash: !!data.poap_content_hash,
            has_image_url: !!data.poap_image_url,
            poap_supply_type: data.poap_supply_type
          });
          
          // Check if any POAP field exists
          if (data.poap_ipfs_hash || data.poap_content_hash || data.poap_image_url) {
            poapData = {
              image: data.poap_image_url,
              expiryDate: data.poap_expiry_date || data.poap_expiry,
              supplyType: data.poap_supply_type,
              supplyCount: data.poap_supply_count,
              minted: data.poap_minted || 0
            };
            console.log('✅ POAP Data loaded:', poapData);
          } else {
            console.log('⚠️ No POAP data found for event', eventId);
          }
        }
      } catch (err) {
        console.warn('❌ Could not fetch POAP data:', err);
      }

      setEventData({
        id: eventId,
        name: eventName,
        date: new Date(Number(eventDate) * 1000).toISOString().split('T')[0],
        organizer: details.organizer,
        ticketContract: details.ticketContract,
        totalTickets,
        soldTickets,
        status: getEventStatus(details.state),
        poap: poapData
      });

      await fetchTicketHolders(ticketContract);
    } catch (err) {
      console.error('Error fetching event data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalTickets = async (contract) => {
    let total = 0;
    for (let i = 0; i < 5; i++) {
      try {
        const tier = await contract.tiers(i);
        if (tier.exists) total += Number(tier.maxSupply);
      } catch { break; }
    }
    return total;
  };

  const getSoldTickets = async (contract) => {
    let sold = 0;
    for (let i = 0; i < 5; i++) {
      try {
        const tier = await contract.tiers(i);
        if (tier.exists) sold += Number(tier.minted);
      } catch { break; }
    }
    return sold;
  };

  const fetchTicketHolders = async (contract) => {
    const holders = [];
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const currentBlock = await provider.getBlockNumber();
      const BLOCK_RANGE = 2000; // Stay under 2048 limit
      const fromBlock = Math.max(0, currentBlock - BLOCK_RANGE);
      
      const filter = contract.filters.TicketPurchased();
      const events = await contract.queryFilter(filter, fromBlock, 'latest');
      
      console.log(`Found ${events.length} ticket purchase events`);
      
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
            checkedIn: false
          });
        }
      });
    } catch (err) {
      console.warn('Could not fetch ticket holders:', err);
    }
    
    setTickets(holders);
  };

  const getEventStatus = (state) => {
    const states = ['Draft', 'Active', 'Ended', 'Cancelled'];
    return states[state] || 'Unknown';
  };

  return { eventData, tickets, loading, error, refetch: fetchEventData };
};
