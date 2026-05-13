import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';

const POAP_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenEvent(uint256 tokenId) view returns (uint256)',
  'event POAPAwarded(uint256 indexed tokenId, uint256 indexed eventId, address indexed attendee, bytes32 metadataHash)'
];

const BADGE_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function getOrganizerReputation(address organizer) view returns (uint256)',
  'function badgeMetadata(uint256 badgeId) view returns (uint256 eventId, uint256 issuedAt, uint256 attendeeCount, bytes32 encryptedData)',
  'event BadgeAwarded(uint256 indexed badgeId, uint256 indexed eventId, address indexed organizer, uint256 attendeeCount)'
];

export const useAchievements = (walletAddress) => {
  const [achievements, setAchievements] = useState([]);
  const [poaps, setPoaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (walletAddress) {
      fetchAchievements();
    }
  }, [walletAddress]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Fetch POAPs
      const poapContract = new ethers.Contract(CONTRACTS.POAP, POAP_ABI, provider);
      const poapBalance = await poapContract.balanceOf(walletAddress);
      const poapCount = Number(poapBalance);

      // Fetch Badges
      const badgeContract = new ethers.Contract(CONTRACTS.EVENT_BADGE, BADGE_ABI, provider);
      const badgeBalance = await badgeContract.balanceOf(walletAddress);
      const badgeCount = Number(badgeBalance);

      // Fetch tickets purchased
      const ticketsResponse = await fetch(`http://localhost:8080/api/tickets/wallet/${walletAddress}`);
      const ticketsData = await ticketsResponse.json();
      const ticketCount = ticketsData.success ? ticketsData.tickets.length : 0;

      // Fetch events created
      const eventsResponse = await fetch(`http://localhost:8080/api/events/creator/${walletAddress}`);
      const eventsData = await eventsResponse.json();
      const eventCount = eventsData.success ? eventsData.events.length : 0;

      // Build achievements based on real data
      const realAchievements = [];

      // Early Adopter (if has any POAPs or created events)
      if (poapCount > 0 || eventCount > 0) {
        realAchievements.push({
          id: 1,
          title: 'Early Adopter',
          description: `Joined EventVerse with ${poapCount} POAPs`,
          icon: 'Star',
          color: 'purple',
          onChain: true
        });
      }

      // Event Creator
      if (eventCount > 0) {
        realAchievements.push({
          id: 2,
          title: 'Event Creator',
          description: `Created ${eventCount} event${eventCount > 1 ? 's' : ''}`,
          icon: 'Zap',
          color: 'blue',
          onChain: true,
          count: eventCount
        });
      }

      // Super Attendee
      if (ticketCount >= 5) {
        realAchievements.push({
          id: 3,
          title: 'Super Attendee',
          description: `Attended ${ticketCount} events`,
          icon: 'Target',
          color: 'green',
          onChain: false,
          count: ticketCount
        });
      }

      // Badge Collector
      if (badgeCount > 0) {
        realAchievements.push({
          id: 4,
          title: 'Badge Collector',
          description: `Earned ${badgeCount} organizer badge${badgeCount > 1 ? 's' : ''}`,
          icon: 'Award',
          color: 'yellow',
          onChain: true,
          count: badgeCount
        });
      }

      // POAP Collector
      if (poapCount >= 3) {
        realAchievements.push({
          id: 5,
          title: 'POAP Collector',
          description: `Collected ${poapCount} POAPs`,
          icon: 'Gift',
          color: 'purple',
          onChain: true,
          count: poapCount
        });
      }

      setAchievements(realAchievements);

      // Fetch POAP details
      const poapDetails = [];
      for (let i = 0; i < Math.min(poapCount, 10); i++) {
        try {
          const tokenId = await poapContract.tokenOfOwnerByIndex(walletAddress, i);
          const eventId = await poapContract.tokenEvent(tokenId);
          poapDetails.push({
            id: Number(tokenId),
            name: `Event #${eventId} POAP`,
            event: `Event ${eventId}`,
            tokenId: Number(tokenId),
            eventId: Number(eventId)
          });
        } catch (err) {
          console.warn('Error fetching POAP:', err);
        }
      }
      setPoaps(poapDetails);

    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  return { achievements, poaps, loading, refetch: fetchAchievements };
};
