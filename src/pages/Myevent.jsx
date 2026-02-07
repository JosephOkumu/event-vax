import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, MapPin, Ticket, Sparkles, Wallet, Plus, DollarSign, Users, Clock, Star, Zap, Award, Upload, Infinity } from "lucide-react";
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { EventFactoryABI, TicketNFTABI } from '../abi';
import { CONTRACTS } from '../config/contracts';

// PriceCard component - moved outside to prevent re-creation on every render
const PriceCard = ({ tier, icon: Icon, price, color, features, handleInputChange, focusedField, setFocusedField, isFree }) => (
  <div className={`relative overflow-hidden rounded-xl p-6 transition-all duration-500 hover:scale-105
                  bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-lg
                  border-2 ${color} hover:shadow-lg hover:shadow-${color}/20`}>
    <div className={`absolute inset-0 bg-gradient-to-r ${color.replace('border', 'from')}/10 to-transparent
                    opacity-0 hover:opacity-100 transition-opacity duration-500`} />

    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon className={`w-6 h-6 ${color.replace('border', 'text')}`} />
          <h3 className="text-xl font-bold text-white">{tier}</h3>
        </div>
        {tier === "VVIP" && (
          <Star className="w-5 h-5 text-yellow-400 animate-pulse" />
        )}
      </div>

      <input
        type="number"
        name={`${tier.toLowerCase()}Price`}
        value={price}
        onChange={handleInputChange}
        onFocus={() => setFocusedField(`${tier.toLowerCase()}Price`)}
        onBlur={() => setFocusedField(null)}
        placeholder="0.00"
        disabled={isFree}
        className={`w-full bg-gray-800/50 border ${focusedField === `${tier.toLowerCase()}Price` ? color : 'border-gray-700'
          } rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all duration-300 ${isFree ? 'opacity-50 cursor-not-allowed' : ''}`}
      />

      <ul className="mt-4 space-y-2 text-sm text-gray-400">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start">
            <Zap className={`w-4 h-4 mr-2 mt-0.5 ${color.replace('border', 'text')}`} />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

PriceCard.propTypes = {
  tier: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color: PropTypes.string,
  features: PropTypes.arrayOf(PropTypes.string),
  handleInputChange: PropTypes.func.isRequired,
  focusedField: PropTypes.string,
  setFocusedField: PropTypes.func.isRequired,
  isFree: PropTypes.bool
};

// FloatingParticle component - moved outside to prevent re-creation on every render
const FloatingParticle = ({ delay = 0 }) => (
  <div
    className="absolute rounded-full animate-float"
    style={{
      backgroundColor: Math.random() > 0.5 ? "#9333EA" : "#3B82F6",
      width: `${Math.random() * 3 + 2}px`,
      height: `${Math.random() * 3 + 2}px`,
      animation: `float 8s infinite ${delay}s ease-in-out`,
      opacity: 0.6,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
    }}
  />
);

FloatingParticle.propTypes = {
  delay: PropTypes.number
};

const QuantumEventCreator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = location.state?.mode === 'edit';
  const editingEvent = location.state?.eventData;
  const { walletAddress, isConnected, connectWallet, EXPECTED_CHAIN_ID, switchToAvalanche, validateNetwork } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    venue: '',
    regularPrice: '',
    vipPrice: '',
    vvipPrice: '',
    description: ''
  });
  const [freeTickets, setFreeTickets] = useState({
    regular: false,
    vip: false,
    vvip: false
  });
  const [focusedField, setFocusedField] = useState(null);
  const [eventFlyer, setEventFlyer] = useState(null);
  const [flyerPreview, setFlyerPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // POAP State
  const [includePoap, setIncludePoap] = useState(false);
  const [poapData, setPoapData] = useState({
    image: null,
    expiryDate: '',
    supplyType: 'limitless', // 'limitless' or 'limited'
    supplyCount: ''
  });
  const [poapPreview, setPoapPreview] = useState(null);
  const [poapError, setPoapError] = useState('');

  const handlePoapChange = (e) => {
    const { name, value } = e.target;
    setPoapData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePoapImageUpload = (file) => {
    if (file && validateImage(file)) {
      setPoapData(prev => ({ ...prev, image: file }));
      const previewUrl = URL.createObjectURL(file);
      setPoapPreview(previewUrl);
      setPoapError('');
    } else {
      setPoapError('Invalid image file');
    }
  };

  const removePoapImage = () => {
    setPoapData(prev => ({ ...prev, image: null }));
    setPoapPreview(null);
    setPoapError('');
  };

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1500);

    // Pre-fill form if in edit mode
    if (editMode && editingEvent) {
      // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
      let formattedDate = '';
      if (editingEvent.date) {
        // Check if it's already ISO or date string
        const dateObj = new Date(editingEvent.date);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().slice(0, 16);
        }
      }

      setFormData({
        eventName: editingEvent.name || '',
        eventDate: formattedDate,
        venue: editingEvent.venue || editingEvent.location || 'Online / TBD', // Fallback for missing venue
        regularPrice: editingEvent.ticketTypes?.Regular?.price || editingEvent.regularPrice || '', // Try multiple sources
        vipPrice: editingEvent.ticketTypes?.VIP?.price || editingEvent.vipPrice || '',
        vvipPrice: editingEvent.ticketTypes?.VVIP?.price || editingEvent.vvipPrice || '',
        description: editingEvent.description || ''
      });
      setFreeTickets({
        regular: editingEvent.ticketTypes?.Regular?.isFree || false,
        vip: editingEvent.ticketTypes?.VIP?.isFree || false,
        vvip: editingEvent.ticketTypes?.VVIP?.isFree || false
      });

      if (editingEvent.poap) {
        setIncludePoap(true);
        setPoapData({
          image: null,
          expiryDate: editingEvent.poap.expiryDate || '',
          supplyType: editingEvent.poap.supplyType || 'limitless',
          supplyCount: editingEvent.poap.supplyCount || ''
        });
        if (editingEvent.poap.image) {
          setPoapPreview(editingEvent.poap.image);
        }
      }
    }
  }, [editMode, editingEvent]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPG, PNG, GIF, or WebP)');
      return false;
    }

    if (file.size > maxSize) {
      setUploadError('Image size must be less than 5MB');
      return false;
    }

    setUploadError('');
    return true;
  };

  const handleImageUpload = (file) => {
    if (file && validateImage(file)) {
      setEventFlyer(file);
      const previewUrl = URL.createObjectURL(file);
      setFlyerPreview(previewUrl);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setEventFlyer(null);
    setFlyerPreview(null);
    setUploadError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      alert('Please connect your wallet first!');
      await connectWallet();
      return;
    }

    // Network validation
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      if (currentChainId !== EXPECTED_CHAIN_ID) {
        alert(`⚠️ Wrong Network!\n\nPlease switch to Avalanche Fuji Testnet.\n\nCurrent: Chain ID ${currentChainId}\nRequired: Chain ID ${EXPECTED_CHAIN_ID}`);
        await switchToAvalanche();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Network validation failed:', error);
      alert('Failed to validate network. Please try again.');
      return;
    }

    if (editMode) {
      alert('✅ Event updated successfully! (Frontend Simulation)');
      navigate('/event-dashboard/' + editingEvent.id);
      return;
    }

    // ✅ Validate event date is in the future
    const selectedDate = new Date(formData.eventDate);
    const now = new Date();

    if (selectedDate <= now) {
      alert('❌ Event date must be in the future! Please select a date and time that hasn\'t passed yet.');
      console.warn('⚠️ Event creation failed: Selected date is in the past');
      return;
    }

    // Validate all required fields
    if (!formData.eventName || !formData.venue) {
      alert('❌ Please fill in all required fields (Event Name and Venue)');
      return;
    }

    try {
      // Convert event date to Unix timestamp
      const eventDate = Math.floor(selectedDate.getTime() / 1000);
      const eventEndDate = eventDate + (24 * 60 * 60); // Add 24 hours

      // Connect to blockchain
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACTS.EVENT_FACTORY, EventFactoryABI.abi, signer);

      // Create event on blockchain
      const tx = await contract.createEvent(
        eventDate,
        eventEndDate,
        formData.eventName,
        `ipfs://eventverse/${formData.eventName.replace(/\s+/g, '-').toLowerCase()}`,
        {
          gasLimit: 3000000,
          maxFeePerGas: ethers.parseUnits("25", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("25", "gwei")
        }
      );

      console.log('✅ Blockchain transaction submitted:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Event created on blockchain!');

      // Extract blockchain event ID from EventCreated event
      let blockchainEventId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          if (parsed.name === 'EventCreated') {
            blockchainEventId = parsed.args.eventId.toString();
            console.log('Blockchain Event ID:', blockchainEventId);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!blockchainEventId) {
        throw new Error('Failed to extract event ID from blockchain transaction');
      }

      // Create ticket tiers automatically
      console.log('Creating ticket tiers...');
      const ticketAddress = await contract.eventTicket(blockchainEventId);
      const ticketContract = new ethers.Contract(ticketAddress, TicketNFTABI.abi, signer);

      const tierTx = await ticketContract.createTiersBatch(
        [0, 1, 2],
        [100, 50, 20],
        [
          ethers.parseEther(freeTickets.regular ? "0" : (formData.regularPrice || "0.01")),
          ethers.parseEther(freeTickets.vip ? "0" : (formData.vipPrice || "0.05")),
          ethers.parseEther(freeTickets.vvip ? "0" : (formData.vvipPrice || "0.1"))
        ],
        {
          gasLimit: 3000000,
          maxFeePerGas: ethers.parseUnits("25", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("25", "gwei")
        }
      );
      await tierTx.wait();
      console.log('✅ Ticket tiers created!');

      // Convert image to base64 if present
      let flyerImageBase64 = null;
      if (eventFlyer) {
        flyerImageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(eventFlyer);
        });
      }

      // Prepare event data
      const eventData = {
        eventName: formData.eventName,
        eventDate: formData.eventDate,
        venue: formData.venue,
        regularPrice: freeTickets.regular ? "0" : formData.regularPrice,
        vipPrice: freeTickets.vip ? "0" : formData.vipPrice,
        vvipPrice: freeTickets.vvip ? "0" : formData.vvipPrice,
        freeTickets: freeTickets,
        description: formData.description,
        flyerImage: flyerImageBase64,
        creatorAddress: walletAddress,
        blockchainTxHash: tx.hash,
        blockchainEventId: blockchainEventId,
        poap: includePoap ? {
          ...poapData,
          image: poapData.image ? poapPreview : null // Simplified for now, real implementation would upload to IPFS
        } : null
      };

      // Send to backend API
      let response, result;
      try {
        response = await fetch('http://localhost:8080/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData)
        });
        result = await response.json();
      } catch (fetchError) {
        console.warn('⚠️ Backend API unavailable - event created on blockchain but not saved to database');
        alert(`✅ Event created on blockchain successfully!\n\n⚠️ Note: Backend server is not running, so event wasn\'t saved to database.\n\nBlockchain Event ID: ${blockchainEventId}\nTransaction: ${tx.hash}`);

        // Reset form even if backend failed
        setFormData({
          eventName: '',
          eventDate: '',
          venue: '',
          regularPrice: '',
          vipPrice: '',
          vvipPrice: '',
          description: ''
        });
        setEventFlyer(null);
        setFlyerPreview(null);
        setUploadError('');
        return;
      }

      if (result.success) {
        alert(`✅ Event created successfully! Event ID: ${result.eventId}`);
        console.log('Event saved to database:', result.data);

        // Handle POAP if included
        if (includePoap && poapData.image) {
          try {
            const poapImageBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(poapData.image);
            });

            const poapResponse = await fetch('http://localhost:8080/api/metadata/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'POAP',
                metadata: {
                  name: `${formData.eventName} POAP`,
                  description: `Proof of attendance for ${formData.eventName}`,
                  attributes: [
                    { trait_type: "Event", value: formData.eventName },
                    { trait_type: "Date", value: formData.eventDate },
                    { trait_type: "Venue", value: formData.venue }
                  ]
                },
                image: poapImageBase64
              })
            });

            const poapResult = await poapResponse.json();
            if (poapResult.success) {
              await fetch('http://localhost:8080/api/events/poap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  eventId: result.eventId,
                  ipfsHash: poapResult.ipfsHash,
                  contentHash: poapResult.contentHash,
                  expiryDate: poapData.expiryDate,
                  supplyType: poapData.supplyType,
                  supplyCount: poapData.supplyCount,
                  imageBase64: poapImageBase64
                })
              });
              console.log('✅ POAP uploaded to IPFS:', poapResult.ipfsHash);
            }
          } catch (poapError) {
            console.warn('⚠️ POAP upload failed:', poapError);
          }
        }

        // Reset form
        setFormData({
          eventName: '',
          eventDate: '',
          venue: '',
          regularPrice: '',
          vipPrice: '',
          vvipPrice: '',
          description: ''
        });
        setFreeTickets({ regular: false, vip: false, vvip: false });
        setEventFlyer(null);
        setFlyerPreview(null);
        setUploadError('');
        setIncludePoap(false);
        setPoapData({ image: null, expiryDate: '', supplyType: 'limitless', supplyCount: '' });
        setPoapPreview(null);

        // Redirect to home page after a short delay
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        alert(`❌ Failed to create event: ${result.error || 'Unknown error'}`);
        console.error('Error:', result);
      }
    } catch (error) {
      // Check if user rejected the transaction
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        console.log('ℹ️ Transaction cancelled by user');
        alert('Transaction cancelled. No changes were made.');
        return;
      }

      // Check for specific smart contract errors
      const errorMessage = error.message || error.toString();

      // Event date in the past
      if (errorMessage.includes('EventDateInPast') || error.data?.message?.includes('EventDateInPast')) {
        console.error('❌ Event creation failed: Event date is in the past');
        alert('❌ Event date must be in the future!\n\nPlease select a date and time that hasn\'t passed yet.');
        return;
      }

      // Invalid event duration
      if (errorMessage.includes('InvalidEventDuration')) {
        console.error('❌ Event creation failed: Invalid event duration');
        alert('❌ Invalid event duration!\n\nThe event end time must be after the start time.');
        return;
      }

      // Contract is paused
      if (errorMessage.includes('EnforcedPause')) {
        console.error('❌ Event creation failed: Contract is paused');
        alert('❌ Event creation is temporarily paused.\n\nPlease try again later.');
        return;
      }

      // Transaction reverted (generic)
      if (errorMessage.includes('transaction execution reverted') || error.code === 'CALL_EXCEPTION') {
        console.error('❌ Transaction reverted:', error);
        alert('❌ Transaction failed!\n\nThis could be due to:\n• Event date is in the past\n• Invalid event details\n• Network issues\n\nPlease check your inputs and try again.');
        return;
      }

      // Handling other errors
      console.error('❌ Error creating event:', error);
      alert('❌ Failed to create event. Please check the console for details and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 opacity-20">
        {[...Array(30)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.3} />
        ))}
      </div>

      {/* Loading overlay */}
      <div className={`fixed inset-0 bg-black z-50 transition-opacity duration-1000
                    flex items-center justify-center
                    ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col items-center">
          <Sparkles className="w-12 h-12 text-purple-500 animate-spin" />
          <p className="mt-4 text-purple-400 animate-pulse">Initializing Event Creator...</p>
        </div>
      </div>

      {/* Navigation Bar */}
      {/* <nav className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md z-40 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Quantum Events
            </h2>
            <div className="hidden md:flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Dashboard</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">My Events</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Analytics</a>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg bg-purple-600/80 hover:bg-purple-500 transition-all duration-300 flex items-center space-x-2 text-sm">
            <Wallet className="w-4 h-4" />
            <span>Connect</span>
          </button>
        </div>
      </nav> */}

      <main className="relative container mx-auto px-4 py-20 sm:py-24 max-w-7xl">
        {/* Header section */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16" style={{ transform: `translateY(${scrollPosition * 0.3}px)` }}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 relative inline-block">
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400
                         bg-clip-text text-transparent animate-gradient-x">
              {editMode ? 'Edit Your Event' : 'Create Your Quantum Event'}
            </span>
            <Sparkles className="absolute -right-6 sm:-right-8 top-0 w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-bounce" />
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4">
            Transform your vision into reality with blockchain-powered ticketing
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Basic Information Card */}
          <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-4 sm:p-6 lg:p-8 hover:border-purple-500/50 transition-all duration-300">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
              Event Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Event Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('eventName')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your event name"
                    className={`w-full bg-gray-800/50 border ${focusedField === 'eventName' ? 'border-purple-500' : 'border-gray-700'
                      } rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all duration-300`}
                    required
                  />
                  {focusedField === 'eventName' && (
                    <div className="absolute inset-0 rounded-lg bg-purple-500/10 -z-10 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                  Event Date *
                </label>
                <input
                  type="datetime-local"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('eventDate')}
                  onBlur={() => setFocusedField(null)}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  className={`w-full bg-gray-800/50 border ${focusedField === 'eventDate' ? 'border-blue-500' : 'border-gray-700'
                    } rounded-lg px-4 py-3 text-white focus:outline-none transition-all duration-300`}
                  required
                />
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-green-400" />
                  Venue *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('venue')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter venue location"
                  className={`w-full bg-gray-800/50 border ${focusedField === 'venue' ? 'border-green-500' : 'border-gray-700'
                    } rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all duration-300`}
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('description')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Describe your event..."
                  rows="4"
                  className={`w-full bg-gray-800/50 border ${focusedField === 'description' ? 'border-purple-500' : 'border-gray-700'
                    } rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all duration-300 resize-none`}
                />
              </div>

              {/* Event Flyer Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Flyer Image
                </label>

                {!flyerPreview ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${isDragging
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 hover:border-purple-500/50 hover:bg-gray-800/30'
                      }`}
                  >
                    <input
                      type="file"
                      id="flyer-upload"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label htmlFor="flyer-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-300 font-medium mb-2">
                          Drag and drop your event flyer here
                        </p>
                        <p className="text-gray-500 text-sm mb-3">or</p>
                        <span className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 transition-all duration-300">
                          Browse Files
                        </span>
                        <p className="text-gray-500 text-xs mt-4">
                          Supported: JPG, PNG, GIF, WebP (Max 5MB)
                        </p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="relative border-2 border-purple-500/50 rounded-xl p-6 bg-purple-500/5">
                    <div className="flex items-start gap-6">
                      <div className="relative group">
                        <img
                          src={flyerPreview}
                          alt="Event flyer preview"
                          className="w-40 h-40 object-cover rounded-lg shadow-lg"
                        />
                        <div className="absolute inset-0 bg-purple-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium mb-2 text-lg">
                          {eventFlyer?.name}
                        </p>
                        <p className="text-gray-400 text-sm mb-4">
                          {(eventFlyer?.size / 1024).toFixed(2)} KB
                        </p>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 hover:border-red-500 transition-all duration-300 text-sm font-medium"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="mt-3 flex items-center text-red-400 text-sm">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {uploadError}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Tiers Card */}
          <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-4 sm:p-6 lg:p-8 hover:border-purple-500/50 transition-all duration-300">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
              Ticket Pricing (AVAX)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {['Regular', 'VIP', 'VVIP'].map((tier) => {
                const tierKey = tier.toLowerCase();
                const isFree = freeTickets[tierKey];
                return (
                  <div key={tier} className="space-y-3">
                    <PriceCard
                      tier={tier}
                      icon={tier === 'Regular' ? Ticket : tier === 'VIP' ? Star : Zap}
                      price={isFree ? '0' : formData[`${tierKey}Price`]}
                      color={tier === 'Regular' ? 'border-green-500' : tier === 'VIP' ? 'border-blue-500' : 'border-yellow-500'}
                      features={tier === 'Regular' ? ["Standard entry", "Event access", "Digital ticket"] : tier === 'VIP' ? ["Priority entry", "VIP lounge access", "Premium seating", "Meet & greet"] : ["Exclusive access", "Backstage pass", "Private area", "Gift package", "Photo opportunity"]}
                      handleInputChange={handleInputChange}
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                      isFree={isFree}
                    />
                    <button
                      type="button"
                      onClick={() => setFreeTickets(prev => ({ ...prev, [tierKey]: !prev[tierKey] }))}
                      className={`w-full py-2 px-4 rounded-lg border transition-all text-sm font-medium ${isFree ? 'bg-green-600/20 border-green-500 text-green-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                      {isFree ? '✓ Free Ticket' : 'Make Free'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* POAP Section */}
          <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-4 sm:p-6 lg:p-8 hover:border-purple-500/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
                Proof of Attendance Protocol (POAP)
              </h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includePoap"
                  checked={includePoap}
                  onChange={(e) => setIncludePoap(e.target.checked)}
                  className="hidden"
                />
                <label
                  htmlFor="includePoap"
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none cursor-pointer ${includePoap ? 'bg-purple-600' : 'bg-gray-700'
                    }`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${includePoap ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </label>
                <label htmlFor="includePoap" className="ml-3 text-sm font-medium text-gray-300 cursor-pointer">
                  Include POAPs
                </label>
              </div>
            </div>

            {includePoap && (
              <div className="space-y-6 animate-fade-in-down">
                <p className="text-sm text-gray-400 mb-4">
                  Reward your attendees with a unique digital collectible to commemorate their participation.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* POAP Image Upload */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      POAP Artwork *
                    </label>
                    {!poapPreview ? (
                      <div className="relative border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-purple-500/50 hover:bg-gray-800/30 transition-all duration-300">
                        <input
                          type="file"
                          id="poap-upload"
                          accept="image/*"
                          onChange={(e) => handlePoapImageUpload(e.target.files[0])}
                          className="hidden"
                        />
                        <label htmlFor="poap-upload" className="cursor-pointer flex flex-col items-center">
                          <Upload className="w-8 h-8 text-purple-400 mb-2" />
                          <span className="text-sm text-gray-300">Click to upload POAP artwork</span>
                          <span className="text-xs text-gray-500 mt-1">Recommended: 500x500px, PNG/GIF</span>
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-xl border border-purple-500/20">
                        <img src={poapPreview} alt="POAP Preview" className="w-20 h-20 rounded-full object-cover border-2 border-purple-500" />
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium">{poapData.image?.name}</p>
                          <button
                            type="button"
                            onClick={removePoapImage}
                            className="text-xs text-red-400 hover:text-red-300 mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                    {poapError && <p className="text-xs text-red-400 mt-2">{poapError}</p>}
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Expiry Date *
                    </label>
                    <input
                      type="datetime-local"
                      name="expiryDate"
                      value={poapData.expiryDate}
                      onChange={handlePoapChange}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  {/* Supply */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Supply Limit
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-3">
                      <button
                        type="button"
                        onClick={() => setPoapData(prev => ({ ...prev, supplyType: 'limitless' }))}
                        className={`w-full sm:flex-1 py-2 px-4 rounded-lg border transition-all ${poapData.supplyType === 'limitless'
                          ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Infinity className="w-4 h-4" />
                          <span>Limitless</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPoapData(prev => ({ ...prev, supplyType: 'limited' }))}
                        className={`w-full sm:flex-1 py-2 px-4 rounded-lg border transition-all ${poapData.supplyType === 'limited'
                          ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                      >
                        Specific
                      </button>
                    </div>
                    {poapData.supplyType === 'limited' && (
                      <input
                        type="number"
                        name="supplyCount"
                        value={poapData.supplyCount}
                        onChange={handlePoapChange}
                        placeholder="Enter max supply"
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="group relative px-8 sm:px-12 py-3 sm:py-4 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 animate-gradient-x" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(45deg, rgba(168,85,247,0.4) 0%, rgba(147,51,234,0.4) 100%)' }} />
              <div className="relative z-10 flex items-center justify-center space-x-2 sm:space-x-3">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-bold text-base sm:text-lg">{editMode ? 'Update Event' : 'Create Event'}</span>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              </div>
            </button>
          </div>
        </form>

        {/* Info Banner */}
        <div className="mt-12 bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-purple-400 font-medium mb-2">Event Creation Tips</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Ensure all event details are accurate before publishing</li>
                <li>• Set competitive pricing based on your event type and venue</li>
                <li>• Your event will be minted as NFTs on the blockchain</li>
                <li>• You can edit event details up to 24 hours before the event date</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 15s linear infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        ::-webkit-scrollbar-thumb {
          background: #9333EA;
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #a855f7;
        }
      `}</style>
    </div >
  );
};

export default QuantumEventCreator;