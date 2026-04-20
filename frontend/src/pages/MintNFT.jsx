import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Wallet,
  Eye,
  Zap,
  Ticket,
  CheckCircle,
  Loader2,
  Calendar,
  MapPin,
  Star,
  Shield,
  X,
  ArrowRight,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import CommentRatingSection from '../components/CommentRatingSection';
import { useWallet } from '../contexts/WalletContext';
import { useCurrency } from '../utils/currency.jsx';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';
import { EventFactoryABI, TicketNFTABI } from '../abi';

const QuantumMintNFT = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId');
  const { format, toAVAX, currency } = useCurrency();
  const fromTicketPage = searchParams.get('fromTicket') === 'true';

  const { walletAddress, isConnecting, connectWallet } = useWallet();
  const [mintingStatus, setMintingStatus] = useState(null);
  const [tokenURI, setTokenURI] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mintedTicketData, setMintedTicketData] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [eventData, setEventData] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [selectedTicketType, setSelectedTicketType] = useState('regular');
  const [showCommentsPreview, setShowCommentsPreview] = useState(false);
  const [hasTicketMinted, setHasTicketMinted] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  useEffect(() => {
    fetchEventData();
    checkIfTicketMinted();
  }, [eventId]);

  useEffect(() => {
    if (walletAddress && currentStep < 2) {
      setCurrentStep(2);
    }
  }, [walletAddress]);

  const checkIfTicketMinted = () => {
    if (!eventId) return;

    // Check if user has already minted a ticket for this event
    const walletAddr = localStorage.getItem('walletAddress');
    if (walletAddr) {
      const mintedTickets = localStorage.getItem(`mintedTickets_${walletAddr}`);
      if (mintedTickets) {
        const tickets = JSON.parse(mintedTickets);
        const ticketForEvent = tickets.find(t =>
          t.eventName && eventData && t.eventName.includes(eventData.name)
        );
        if (ticketForEvent) {
          setHasTicketMinted(true);
          setCurrentStep(5); // Jump to comments step
        }
      }
    }
  };

  const fetchEventData = async () => {
    if (!eventId) {
      setError('No event selected');
      setLoadingEvent(false);
      return;
    }

    try {
      setLoadingEvent(true);
      const response = await fetch(`http://localhost:8080/api/events/${eventId}`);
      const result = await response.json();

      if (result.success) {
        const event = result.data;
        const formattedEventData = {
          name: event.event_name,
          description: event.description || `Official access ticket for ${event.event_name}. This NFT grants exclusive access to the event.`,
          image: event.flyer_image || "ipfs://QmPreUploadedEventImage",
          date: new Date(event.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          venue: event.venue,
          ticketPrices: {
            regular: event.regular_price || '0',
            vip: event.vip_price || '0',
            vvip: event.vvip_price || '0'
          },
          rawData: event
        };
        setEventData(formattedEventData);
      } else {
        setError('Event not found');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event data');
    } finally {
      setLoadingEvent(false);
    }
  };

  const getCurrentTicketDetails = () => {
    if (!eventData) return null;

    const ticketTypes = {
      regular: { label: 'Regular', price: eventData.ticketPrices.regular },
      vip: { label: 'VIP', price: eventData.ticketPrices.vip },
      vvip: { label: 'VVIP', price: eventData.ticketPrices.vvip }
    };

    const selected = ticketTypes[selectedTicketType];

    return {
      name: `${eventData.name} - ${selected.label} Ticket`,
      description: eventData.description,
      image: eventData.image,
      attributes: [
        { trait_type: "Event", value: eventData.name },
        { trait_type: "Ticket Type", value: selected.label },
        { trait_type: "Price", value: format(selected.price) },
        { trait_type: "Date", value: eventData.date },
        { trait_type: "Venue", value: eventData.venue }
      ]
    };
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleConnectWallet = async () => {
    setError(null);
    try {
      await connectWallet();
      setCurrentStep(2);
    } catch (error) {
      console.error('❌ Wallet connection error:', error);
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const generateTokenURI = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMintingStatus('Generating ticket metadata...');
      setCurrentStep(3);

      const currentTicket = getCurrentTicketDetails();
      const ticketMetadata = {
        ...currentTicket,
        attributes: [
          ...currentTicket.attributes,
          { trait_type: "Owner", value: walletAddress },
          { trait_type: "Mint Date", value: new Date().toISOString() },
          { trait_type: "Ticket ID", value: `TICKET-${Date.now()}` }
        ]
      };

      const mockIPFSHash = `Qm${Math.random().toString(36).substring(2, 15)}`;
      const tokenURI = `ipfs://${mockIPFSHash}`;

      await new Promise(resolve => setTimeout(resolve, 2000));

      setTokenURI(tokenURI);
      setMintingStatus('✅ Ticket metadata generated successfully!');

      localStorage.setItem('pendingTicketMetadata', JSON.stringify(ticketMetadata));

    } catch (error) {
      console.error("Error generating token URI:", error);
      setError("Failed to generate ticket metadata. Please try again.");
      setMintingStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintNFT = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setMintingStatus('Preparing transaction...');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Use stored blockchain_event_id
      const blockchainEventId = eventData.rawData.blockchain_event_id;
      
      if (!blockchainEventId) {
        throw new Error('This event was not properly created on the blockchain. Please contact the event organizer.');
      }

      setMintingStatus('Loading event contract...');

      // Get ticket contract address
      const factoryContract = new ethers.Contract(
        CONTRACTS.EVENT_FACTORY, 
        EventFactoryABI.abi, 
        provider
      );
      
      const ticketContractAddress = await factoryContract.eventTicket(blockchainEventId);
      
      if (ticketContractAddress === ethers.ZeroAddress) {
        throw new Error('Event ticket contract not found on blockchain.');
      }

      setMintingStatus('Preparing purchase...');

      const ticketContract = new ethers.Contract(
        ticketContractAddress, 
        TicketNFTABI.abi, 
        signer
      );

      // Map ticket types to tier IDs
      const tierMap = { regular: 0, vip: 1, vvip: 2 };
      const tierId = tierMap[selectedTicketType];

      // Calculate total cost (convert to AVAX for blockchain)
      const price = eventData.ticketPrices[selectedTicketType];
      const priceInAVAX = toAVAX(price);
      const totalCost = ethers.parseEther((parseFloat(priceInAVAX) * ticketQuantity).toString());

      setMintingStatus(`Purchasing ${ticketQuantity} ticket(s)...`);

      // Purchase tickets on blockchain
      const tx = await ticketContract.purchaseTicket(tierId, ticketQuantity, {
        value: totalCost,
        maxFeePerGas: ethers.parseUnits('25', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
      });

      setMintingStatus('Waiting for blockchain confirmation...');
      const receipt = await tx.wait();

      setMintingStatus('Saving ticket to database...');

      // Save to database with blockchain proof
      const ticketData = {
        eventId,
        walletAddress,
        ticketType: selectedTicketType,
        quantity: ticketQuantity,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        ticketContractAddress,
        tierId,
        blockchainEventId
      };

      const backendResponse = await fetch('http://localhost:8080/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });

      const backendResult = await backendResponse.json();

      // Set ticket data for success modal
      setMintedTicketData({
        eventName: eventData.name,
        ticketType: selectedTicketType,
        totalQuantity: ticketQuantity,
        price: eventData.ticketPrices[selectedTicketType],
        tokenId: tx.hash
      });

      if (!backendResponse.ok || !backendResult.success) {
        console.warn('Backend save failed:', backendResult);
        setMintingStatus('⚠️ Tickets purchased on blockchain but database save failed');
        // Still show success since blockchain transaction succeeded
        setTimeout(() => {
          setMintingStatus(`🎉 ${ticketQuantity} Ticket(s) Purchased!`);
          setShowSuccessModal(true);
        }, 2000);
      } else {
        console.log('✅ Ticket saved to database:', backendResult);
        setMintingStatus(`🎉 ${ticketQuantity} Ticket(s) Purchased!`);
        setShowSuccessModal(true);
      }

    } catch (error) {
      console.error('❌ Minting error details:', error);
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        setMintingStatus(null);
        setError('Transaction cancelled by user');
        return;
      }
      
      // User-friendly error messages
      let userMessage = 'Failed to purchase tickets';
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        userMessage = 'Insufficient AVAX balance. Please add funds to your wallet.';
      } else if (error.message?.includes('insufficient funds')) {
        userMessage = 'Insufficient AVAX balance. Please add funds to your wallet.';
      } else if (error.message?.includes('user rejected')) {
        userMessage = 'Transaction cancelled by user';
      } else if (error.message?.includes('network')) {
        userMessage = 'Network error. Please check your connection.';
      }
      
      setError(userMessage);
      setMintingStatus(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewTickets = () => {
    setShowSuccessModal(false);
    window.location.href = '/ticket';
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setMintedTicketData(null);
    setCurrentStep(5); // Move to comments section after minting
    setHasTicketMinted(true);
  };

  const FloatingParticle = ({ delay = 0 }) => {
    const bgColor = Math.random() > 0.5 ? "#9333EA" : "#3B82F6";
    const particleWidth = `${Math.random() * 3 + 2}px`;
    const particleHeight = `${Math.random() * 3 + 2}px`;
    const particleTop = `${Math.random() * 100}%`;
    const particleLeft = `${Math.random() * 100}%`;

    return (
      <div
        className="absolute rounded-full animate-float"
        style={{
          backgroundColor: bgColor,
          width: particleWidth,
          height: particleHeight,
          animation: 'float 8s ease-in-out infinite',
          animationDelay: `${delay}s`,
          opacity: 0.6,
          top: particleTop,
          left: particleLeft,
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-20">
        {[...Array(30)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.3} />
        ))}
      </div>

      {/* Navigation Bar */}
      {/* <nav className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md z-40 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Quantum Mint
            </h2>
          </div>
          {walletAddress && (
            <div className="px-4 py-2 rounded-lg bg-purple-600/20 border border-purple-500/30">
              <p className="text-xs text-gray-400">Connected</p>
              <p className="text-sm font-mono text-purple-300">{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</p>
            </div>
          )}
        </div>
      </nav> */}

      <main className="relative container mx-auto px-4 py-20 sm:py-24 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12" style={{ transform: `translateY(${scrollPosition * 0.3}px)` }}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 relative inline-block">
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 
                         bg-clip-text text-transparent animate-gradient-x">
              Mint Your Quantum Ticket
            </span>
            <Sparkles className="absolute -right-6 sm:-right-8 top-0 w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-bounce" />
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4">
            Create your exclusive NFT ticket on the blockchain
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 sm:mb-10">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
            {[
              { num: 1, label: 'Connect', icon: Wallet },
              { num: 2, label: 'Preview', icon: Eye },
              // { num: 3, label: 'Generate', icon: Zap },
              { num: 3, label: 'Mint', icon: Ticket },
              { num: 4, label: 'Comments', icon: MessageSquare }
            ].map(({ num, label, icon: Icon }) => (
              <div key={num} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500
                              ${currentStep >= num
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 scale-110'
                    : 'bg-gray-800 border border-gray-700'}`}>
                  {currentStep > num ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                  ) : (
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${currentStep >= num ? 'text-white' : 'text-gray-500'}`} />
                  )}
                </div>
                <p className={`text-xs sm:text-sm mt-2 ${currentStep >= num ? 'text-purple-400' : 'text-gray-500'}`}>
                  {label}
                </p>
                {num < 5 && (
                  <div className={`hidden md:block absolute w-16 lg:w-24 h-0.5 left-1/2 top-5 lg:top-6 transition-all duration-500
                    ${currentStep > num ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gray-700'}`}
                    style={{ transform: 'translateX(50%)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-gray-900/30 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-4 sm:p-6 lg:p-8 
                      hover:border-purple-500/50 transition-all duration-300 mb-6 sm:mb-8">

          {/* Loading Event Data */}
          {loadingEvent ? (
            <div className="text-center py-8 sm:py-12">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-400">Loading event details...</p>
            </div>
          ) : !eventData ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-red-400 mb-4">Event not found or failed to load</p>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 sm:px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-sm sm:text-base"
              >
                Back to Events
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: Connect Wallet */}
              {!walletAddress ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full 
                                flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Connect Your Wallet</h3>
                  <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 px-4">Connect your wallet to start minting your NFT ticket</p>
                  <button
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                    className="group relative px-6 sm:px-8 py-3 sm:py-4 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 animate-gradient-x" />
                    <div className="relative z-10 flex items-center space-x-2">
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="font-semibold text-sm sm:text-base">Connect Wallet</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              ) : (
                <>
                  {/* Only show steps 2-4 content if NOT on step 5 */}
                  {currentStep < 5 && (
                    <>
                      {/* Ticket Type Selection */}
                      <div className="mb-6 sm:mb-8">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <Ticket className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
                      <h3 className="text-xl sm:text-2xl font-bold">Select Ticket Type</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {/* Regular Ticket */}
                      <button
                        onClick={() => setSelectedTicketType('regular')}
                        className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105
                          ${selectedTicketType === 'regular'
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-gray-700 bg-gray-800/50 hover:border-green-500/50'}`}
                      >
                        {selectedTicketType === 'regular' && (
                          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                          </div>
                        )}
                        <div className="flex items-center mb-2">
                          <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-2" />
                          <h4 className="text-base sm:text-lg font-bold text-white">Regular</h4>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-green-400 mb-1 sm:mb-2">
                          {format(eventData.ticketPrices.regular)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400">Standard event access</p>
                      </button>

                      {/* VIP Ticket */}
                      <button
                        onClick={() => setSelectedTicketType('vip')}
                        className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105
                          ${selectedTicketType === 'vip'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-700 bg-gray-800/50 hover:border-blue-500/50'}`}
                      >
                        {selectedTicketType === 'vip' && (
                          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                          </div>
                        )}
                        <div className="flex items-center mb-2">
                          <Star className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-2" />
                          <h4 className="text-base sm:text-lg font-bold text-white">VIP</h4>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-blue-400 mb-1 sm:mb-2">
                          {format(eventData.ticketPrices.vip)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400">Premium access & perks</p>
                      </button>

                      {/* VVIP Ticket */}
                      <button
                        onClick={() => setSelectedTicketType('vvip')}
                        className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105
                          ${selectedTicketType === 'vvip'
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-700 bg-gray-800/50 hover:border-purple-500/50'}`}
                      >
                        {selectedTicketType === 'vvip' && (
                          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                          </div>
                        )}
                        <div className="flex items-center mb-2">
                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 mr-2" />
                          <h4 className="text-base sm:text-lg font-bold text-white">VVIP</h4>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-purple-400 mb-1 sm:mb-2">
                          {format(eventData.ticketPrices.vvip)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400">Exclusive VIP experience</p>
                      </button>
                    </div>
                  </div>

                  {/* Ticket Quantity Selection */}
                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <Ticket className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
                      <h3 className="text-xl sm:text-2xl font-bold">Number of Tickets</h3>
                    </div>

                    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-4 sm:p-6 border border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <label htmlFor="quantity" className="block text-sm text-gray-400 mb-2">
                            Select quantity (1-10)
                          </label>
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600
                                       flex items-center justify-center transition-all duration-200 hover:scale-110"
                              disabled={ticketQuantity <= 1}
                            >
                              <span className="text-xl font-bold text-white">-</span>
                            </button>

                            <input
                              type="number"
                              id="quantity"
                              min="1"
                              max="10"
                              value={ticketQuantity}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                setTicketQuantity(Math.min(10, Math.max(1, value)));
                              }}
                              className="w-20 sm:w-24 text-center text-2xl sm:text-3xl font-bold bg-gray-700/50 border-2 border-purple-500/50
                                       rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-all"
                            />

                            <button
                              onClick={() => setTicketQuantity(Math.min(10, ticketQuantity + 1))}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600
                                       flex items-center justify-center transition-all duration-200 hover:scale-110"
                              disabled={ticketQuantity >= 10}
                            >
                              <span className="text-xl font-bold text-white">+</span>
                            </button>
                          </div>
                        </div>

                        <div className="ml-6 text-right">
                          <p className="text-sm text-gray-400 mb-1">Total Price</p>
                          <p className="text-2xl sm:text-3xl font-bold text-purple-400">
                            {format((parseFloat(eventData.ticketPrices[selectedTicketType]) * ticketQuantity).toFixed(4))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Preview */}
                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-center mb-3 sm:mb-4">
                      <Eye className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
                      <h3 className="text-xl sm:text-2xl font-bold">Ticket Preview</h3>
                    </div>

                    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-4 sm:p-6 border border-gray-700/50">
                      {/* Event Header */}
                      <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-700">
                        <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">{getCurrentTicketDetails()?.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-400">{getCurrentTicketDetails()?.description}</p>
                      </div>

                      {/* Attributes Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        {getCurrentTicketDetails()?.attributes.map((attr, index) => (
                          <div key={index} className="bg-gray-700/50 p-3 sm:p-4 rounded-lg hover:bg-gray-700 transition-colors">
                            <div className="flex items-center mb-1 sm:mb-2">
                              {attr.trait_type === "Date" && <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 mr-1" />}
                              {attr.trait_type === "Venue" && <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 mr-1" />}
                              {attr.trait_type === "Ticket Type" && <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 mr-1" />}
                              {attr.trait_type === "Event" && <Ticket className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 mr-1" />}
                              <p className="text-xs text-gray-400">{attr.trait_type}</p>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-white break-words">{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Comments Preview Dropdown */}
                    <div className="mt-4">
                      <button
                        onClick={() => setShowCommentsPreview(!showCommentsPreview)}
                        className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800/70 rounded-lg border border-purple-500/30 transition-all"
                      >
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-5 h-5 text-purple-400" />
                          <span className="text-white font-semibold">Preview Event Comments & Ratings</span>
                        </div>
                        {showCommentsPreview ? (
                          <ChevronUp className="w-5 h-5 text-purple-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-purple-400" />
                        )}
                      </button>

                      {showCommentsPreview && (
                        <div className="mt-4 p-4 bg-gray-800/30 rounded-lg border border-purple-500/20">
                          <CommentRatingSection
                            eventId={eventId}
                            eventName={eventData?.name}
                            canComment={false}
                            showPreview={true}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* <button
                      onClick={generateTokenURI}
                      disabled={isLoading || !walletAddress}
                      className="w-full group relative px-4 sm:px-6 py-3 sm:py-4 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-green-500 to-emerald-500" />
                      <div className="relative z-10 flex items-center justify-center space-x-2">
                        {isLoading && currentStep === 3 ? (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                        <span className="font-semibold text-sm sm:text-base">Generate Ticket Metadata</span>
                      </div>
                    </button> */}

                    <button
                      onClick={handleMintNFT}
                      disabled={isLoading}
                      className={`w-full group relative px-4 sm:px-6 py-3 sm:py-4 rounded-xl overflow-hidden transition-all duration-300
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 animate-gradient-x" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'linear-gradient(45deg, rgba(168,85,247,0.4) 0%, rgba(147,51,234,0.4) 100%)' }} />
                      <div className="relative z-10 flex flex-col items-center justify-center space-y-1">
                        {isLoading && currentStep === 4 ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-xs">Processing...</span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                              <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span className="font-bold text-sm sm:text-base">
                                Buy {ticketQuantity > 1 ? `${ticketQuantity} Tickets` : 'Ticket'}
                              </span>
                              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                            </div>
                            <span className="text-xs text-purple-200">
                              Total: {format((parseFloat(eventData.ticketPrices[selectedTicketType]) * ticketQuantity).toFixed(4))}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </>
              )}
                    </>
                  )}

              {/* Step 5: Comments & Ratings Section (After Minting) */}
              {walletAddress && currentStep === 5 && hasTicketMinted && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-full
                                  flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">Ticket Minted Successfully!</h3>
                    <p className="text-sm sm:text-base text-gray-400 mb-4">
                      Share your experience and rate the event organizer
                    </p>
                  </div>

                  <CommentRatingSection
                    eventId={eventId}
                    eventName={eventData?.name}
                    canComment={true}
                    showPreview={false}
                  />

                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => navigate('/ticket')}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl transition-all duration-300 flex items-center space-x-2"
                    >
                      <Ticket className="w-5 h-5" />
                      <span>View My Tickets</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 animate-pulse">
            <p className="text-red-400 text-center text-sm sm:text-base">{error}</p>
          </div>
        )}

        {mintingStatus && !error && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
            <p className="text-green-400 text-center text-sm sm:text-base">{mintingStatus}</p>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 sm:p-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-blue-400 font-semibold mb-2 text-sm sm:text-base">Security Notice</h4>
              <ul className="text-xs sm:text-sm text-gray-300 space-y-1">
                <li>• Your NFT ticket is securely stored on the Avalanche blockchain</li>
                <li>• Each ticket is unique and cannot be duplicated or forged</li>
                <li>• Keep your wallet private keys secure at all times</li>
                <li>• Transaction fees will be required for minting</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccessModal && mintedTicketData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/50 max-w-lg w-full mx-4 overflow-hidden">
            {/* Confetti Effect */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10%',
                    animation: `fall ${2 + Math.random() * 2}s linear forwards`,
                    animationDelay: `${Math.random() * 0.5}s`
                  }}
                />
              ))}
            </div>

            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-purple-600/30 to-blue-600/30 p-8 text-center">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Success!</h3>
              <p className="text-gray-300">
                {mintedTicketData.totalQuantity > 1
                  ? `${mintedTicketData.totalQuantity} quantum tickets have been minted`
                  : 'Your quantum ticket has been minted'}
              </p>
            </div>

            {/* Ticket Details */}
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-5 border border-gray-700/50">
                <div className="flex items-center space-x-3 mb-4">
                  <Ticket className="w-6 h-6 text-purple-400" />
                  <h4 className="font-semibold text-white text-lg">Ticket Information</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Event:</span>
                    <span className="text-white font-medium">{mintedTicketData.eventName.slice(0, 30)}...</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Type:</span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                      {mintedTicketData.ticketType}
                    </span>
                  </div>
                  {mintedTicketData.totalQuantity > 1 ? (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Quantity:</span>
                      <span className="text-white font-bold text-lg">{mintedTicketData.totalQuantity} Tickets</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Seat:</span>
                      <span className="text-white font-mono">{mintedTicketData.seatNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Price:</span>
                    <span className="text-purple-400 font-bold">
                      {format((parseFloat(mintedTicketData.price) * (mintedTicketData.totalQuantity || 1)).toFixed(4))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Token ID{mintedTicketData.totalQuantity > 1 ? 's' : ''}:</span>
                    <span className="text-green-400 font-mono text-xs">
                      {mintedTicketData.totalQuantity > 1
                        ? `${mintedTicketData.totalQuantity} tickets minted`
                        : mintedTicketData.tokenId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                    <span className="text-gray-400">Status:</span>
                    <span className="flex items-center text-green-400">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Minted
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleViewTickets}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 
                         text-white py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2
                         hover:scale-105"
                >
                  <Eye className="w-5 h-5" />
                  <span className="font-semibold">View My Tickets</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCloseModal}
                  className="w-full bg-gray-700/50 hover:bg-gray-600/50 text-white py-4 px-6 rounded-xl 
                         transition-all duration-300 border border-gray-600"
                >
                  Continue Minting More Tickets
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 15s linear infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default QuantumMintNFT;