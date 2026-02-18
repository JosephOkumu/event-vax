import { useState, useEffect } from 'react';
import { Award, Loader2, Clock } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const ManualPoapMint = ({ eventId, walletAddress }) => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');
  const [blockchainEventId, setBlockchainEventId] = useState(null);
  const [hasPoap, setHasPoap] = useState(false);

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    if (!eventId) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        const bcEventId = data.data.blockchain_event_id;
        const poapConfigured = data.data.poap_ipfs_hash || data.data.poap_image_base64;
        
        setBlockchainEventId(bcEventId);
        setHasPoap(!!poapConfigured);
        
        if (bcEventId && poapConfigured && walletAddress) {
          checkStatus(bcEventId);
        } else {
          setStatus('not_available');
        }
      }
    } catch (err) {
      console.error('Failed to fetch event:', err);
      setStatus('not_available');
    }
  };

  const checkStatus = async (bcEventId) => {
    if (!walletAddress || !bcEventId) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/poap/status/${bcEventId}/${walletAddress}`);
      const data = await res.json();
      setStatus(data.status);
    } catch (err) {
      console.error('Status check failed:', err);
    }
  };

  const requestPoap = async () => {
    if (!blockchainEventId) {
      setError('Event not on blockchain');
      return;
    }
    
    setError('');
    setStatus('requesting');

    try {
      const res = await fetch(`${API_BASE_URL}/api/poap/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: blockchainEventId, walletAddress })
      });

      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
        if (data.status === 'pending') {
          setTimeout(() => checkStatus(blockchainEventId), 5000);
        }
      } else {
        setError(data.error);
        setStatus('not_requested');
      }
    } catch (err) {
      setError('Request failed');
      setStatus('not_requested');
    }
  };

  if (!hasPoap || status === 'issued' || status === 'checking' || status === 'not_available') return null;

  const isDisabled = status === 'pending' || status === 'processing' || status === 'requesting';
  const buttonContent = status === 'pending' || status === 'processing' 
    ? { icon: Clock, text: 'POAP Pending', animate: 'animate-pulse' }
    : status === 'requesting'
    ? { icon: Loader2, text: 'Requesting...', animate: 'animate-spin' }
    : { icon: Award, text: 'Request POAP', animate: '' };

  const Icon = buttonContent.icon;

  return (
    <button
      onClick={requestPoap}
      disabled={isDisabled}
      className="w-full px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 
        hover:from-yellow-500 hover:to-orange-500 text-white rounded-xl 
        transition-all duration-300 flex items-center justify-center space-x-2
        disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
    >
      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${buttonContent.animate}`} />
      <span>{buttonContent.text}</span>
    </button>
  );
};
