import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Ticket as TicketIcon, Calendar, MapPin, User, QrCode, Download, AlertCircle, Loader, Eye, DollarSign, MessageSquare } from 'lucide-react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import EventverseTicket from '../components/EventverseTicket';
import { useWallet } from '../contexts/WalletContext';
import { CONTRACTS, NETWORK } from '../config/contracts';
import { useCurrency } from '../utils/currency.jsx';

const AVALANCHE_MAINNET_PARAMS = {
  chainId: '0xA86A',
  chainName: NETWORK.NAME,
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18
  },
  rpcUrls: [NETWORK.RPC_URL],
  blockExplorerUrls: [NETWORK.EXPLORER]
};

const Ticket = () => {
  const { walletAddress, isConnecting, connectWallet, isConnected, networkId, EXPECTED_CHAIN_ID, switchToAvalanche } = useWallet();
  const { format } = useCurrency();

  // UI States
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ticket States
  const [userTickets, setUserTickets] = useState([]);
  const ticketRef = useRef(null);

  const handleDownloadTicket = async () => {
    if (ticketRef.current === null) {
      return;
    }

    try {
      const dataUrl = await toPng(ticketRef.current, { cacheBust: true, pixelRatio: 2 });
      saveAs(dataUrl, `Eventverse-Ticket-${selectedTicket.tokenId}.png`);
    } catch (err) {
      console.error('Error downloading ticket:', err);
      // Optional: Add a toast or error state here
    }
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchUserTickets();
    } else {
      setUserTickets([]);
    }
  }, [isConnected, walletAddress]);

  const fetchUserTickets = async () => {
    try {
      setIsLoading(true);

      // Fetch tickets from backend
      const response = await fetch(`http://localhost:8080/api/tickets/wallet/${walletAddress}`);
      const result = await response.json();

      if (result.success && result.tickets.length > 0) {
        const formattedTickets = result.tickets.map((ticket, index) => ({
          tokenId: ticket.id.toString(),
          eventId: ticket.event_id,
          eventName: ticket.event_name,
          eventDate: new Date(ticket.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          eventTime: new Date(ticket.event_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          venue: ticket.venue,
          address: ticket.venue,
          ticketType: ['Regular', 'VIP', 'VVIP'][ticket.tier_id] || 'General',
          seatNumber: `${['REG', 'VIP', 'VVIP'][ticket.tier_id]}-${ticket.id}`,
          price: ticket.price || '0',
          qrCode: ticket.qr_code,
          status: ticket.verified ? 'Valid' : 'Pending',
          description: ticket.description || 'Event ticket',
          image: ticket.flyer_image || `https://images.unsplash.com/photo-${1540575467063 + index}?w=400&h=300&fit=crop`,
          mintDate: ticket.created_at,
          owner: walletAddress,
          quantity: ticket.quantity,
          transactionHash: ticket.transaction_hash
        }));

        console.log('🔍 First ticket transaction hash:', formattedTickets[0]?.transactionHash);

        setUserTickets(formattedTickets);
        if (formattedTickets.length > 0 && !selectedTicket) {
          setSelectedTicket(formattedTickets[0]);
        }
      } else {
        setUserTickets([]);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setError("Failed to fetch your tickets. Please try again.");
      setUserTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setError(null);
      await connectWallet();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError(error.message || "Failed to connect wallet. Please try again.");
    }
  };

  const handleViewOnExplorer = () => {
    // Find the latest ticket data from userTickets array
    const currentTicket = userTickets.find(t => t.tokenId === selectedTicket?.tokenId);
    console.log('🔍 Current ticket from array:', currentTicket);
    console.log('🔍 Transaction hash:', currentTicket?.transactionHash);

    if (currentTicket && currentTicket.transactionHash) {
      window.open(`${NETWORK.EXPLORER}/tx/${currentTicket.transactionHash}`, '_blank');
    } else {
      alert('Transaction hash not available for this ticket');
    }
  };

  const handleResellTicket = () => {
    // Store the selected ticket data for the resell page
    if (selectedTicket) {
      localStorage.setItem('resellTicketData', JSON.stringify(selectedTicket));
      window.location.href = '/resell';
    }
  };

  const handleCommentOnEvent = () => {
    // Navigate to mint page with fromTicket flag to show comments section
    if (selectedTicket) {
      // Extract event ID from ticket data (you may need to adjust this based on your data structure)
      const eventId = selectedTicket.eventId || selectedTicket.tokenId;
      window.location.href = `/mint?eventId=${eventId}&fromTicket=true`;
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTicketTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'vip access':
        return 'from-purple-600 to-pink-600';
      case 'speaker pass':
        return 'from-blue-600 to-cyan-600';
      case 'general admission':
        return 'from-green-600 to-emerald-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const generateQRCode = (ticket) => {
    const qrData = `${ticket.eventName}|${ticket.tokenId}|${ticket.seatNumber}|${walletAddress}`;
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23fff'/><text x='100' y='100' text-anchor='middle' font-size='12' fill='%23000'>QR: ${ticket.qrCode}</text></svg>`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 300}px`,
              height: `${Math.random() * 300}px`,
              background: 'radial-gradient(circle, rgba(147,51,234,0.3) 0%, rgba(0,0,0,0) 70%)',
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <main className="relative pt-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Title Section */}
          <div className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-1000
            ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                My Event Tickets
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto px-4">
              View and manage your event tickets. Each ticket is securely stored on the blockchain as an NFT.
            </p>
          </div>

          {!isConnected ? (
            <div className="text-center">
              <div className="mb-8 p-6 sm:p-8 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-purple-500/30">
                <TicketIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-purple-400" />
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Connect Your Wallet</h2>
                <p className="text-sm sm:text-base text-gray-400 mb-6 px-4">
                  Connect your wallet to view your ticket collection
                </p>
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="group relative px-6 py-3 rounded-xl overflow-hidden w-full sm:w-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600
                    group-hover:from-purple-500 group-hover:to-blue-500 transition-colors duration-300" />
                  <div className="relative z-10 flex items-center justify-center space-x-2">
                    {isConnecting ? <Loader className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
                    <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
                  </div>
                </button>
              </div>
            </div>
          ) : networkId !== EXPECTED_CHAIN_ID ? (
            <div className="text-center">
              <div className="mb-8 p-6 sm:p-8 bg-red-900/20 backdrop-blur-xl rounded-2xl border border-red-500/30">
                <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-red-400" />
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Wrong Network</h2>
                <p className="text-sm sm:text-base text-gray-400 mb-6 px-4">
                  Please switch to Avalanche Fuji Testnet to view your tickets
                </p>
                <button
                  onClick={switchToAvalanche}
                  className="group relative px-6 py-3 rounded-xl overflow-hidden w-full sm:w-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600
                    group-hover:from-red-500 group-hover:to-orange-500 transition-colors duration-300" />
                  <div className="relative z-10 flex items-center justify-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>Switch to Avalanche Fuji</span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Wallet Info */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 rounded-xl bg-purple-500/10 border border-purple-500/30 gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs sm:text-sm text-gray-400">Connected Wallet</div>
                      <div className="font-mono text-sm sm:text-base lg:text-lg break-all">{formatAddress(walletAddress)}</div>
                      <div className="text-xs text-gray-500">Network: Avalanche C-Chain</div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <div className="text-xs sm:text-sm text-gray-400">Total Tickets</div>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-400">{userTickets.length}</div>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <Loader className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-400" />
                  <p className="text-gray-400">Loading your tickets...</p>
                </div>
              ) : userTickets.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                  {/* Ticket List - Left Sidebar */}
                  <div className="lg:col-span-1">
                    <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-200 flex items-center">
                      <TicketIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Your Tickets ({userTickets.length})
                    </h3>
                    <div className="space-y-3 max-h-64 sm:max-h-80 lg:max-h-96 overflow-y-auto">
                      {userTickets.map((ticket) => (
                        <div
                          key={ticket.tokenId}
                          onClick={() => setSelectedTicket(ticket)}
                          className={`group p-4 rounded-xl border cursor-pointer transition-all duration-300 
                            ${selectedTicket?.tokenId === ticket.tokenId
                              ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                              : 'border-gray-600 bg-gray-700/30 hover:border-purple-400/50 hover:bg-gray-600/40'
                            }`}
                        >
                          <div className="flex items-start space-x-3">
                            <img
                              src={ticket.image}
                              alt={ticket.eventName}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className={`px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getTicketTypeColor(ticket.ticketType)} text-white`}>
                                  {ticket.ticketType}
                                </div>
                                <span className="text-xs text-gray-400">#{ticket.tokenId}</span>
                              </div>
                              <h4 className="font-semibold text-white mb-1 truncate">{ticket.eventName}</h4>
                              <p className="text-sm text-gray-400">{ticket.eventDate}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-green-400 flex items-center">
                                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1" />
                                  {ticket.status}
                                </span>
                                <span className="text-xs text-purple-400">{ticket.seatNumber}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ticket Detail - Main Content */}
                  <div className="lg:col-span-3 mb-10 md:mb-20">
                    {selectedTicket && (
                      <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-purple-500/30 overflow-hidden">
                        {/* Ticket Header with Image */}
                        <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
                          <img
                            src={selectedTicket.image}
                            alt={selectedTicket.eventName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div>
                                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">{selectedTicket.eventName}</h2>
                                <div className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r ${getTicketTypeColor(selectedTicket.ticketType)} text-white`}>
                                  {selectedTicket.ticketType}
                                </div>
                              </div>
                              <div className="text-left sm:text-right">
                                <div className="text-xs sm:text-sm text-gray-300">Token ID</div>
                                <div className="text-lg sm:text-xl font-mono text-purple-400">#{selectedTicket.tokenId}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 sm:p-6 lg:p-8">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                            {/* Event Details */}
                            <div className="lg:col-span-2 space-y-6">
                              {/* Date & Time */}
                              <div className="flex items-start space-x-4 p-4 bg-gray-800/50 rounded-xl">
                                <Calendar className="w-6 h-6 text-purple-400 mt-1" />
                                <div>
                                  <h3 className="font-semibold text-white mb-1">Date & Time</h3>
                                  <p className="text-gray-300">{selectedTicket.eventDate}</p>
                                  <p className="text-sm text-gray-400">{selectedTicket.eventTime}</p>
                                </div>
                              </div>

                              {/* Location */}
                              <div className="flex items-start space-x-4 p-4 bg-gray-800/50 rounded-xl">
                                <MapPin className="w-6 h-6 text-purple-400 mt-1" />
                                <div>
                                  <h3 className="font-semibold text-white mb-1">Location</h3>
                                  <p className="text-gray-300">{selectedTicket.venue}</p>
                                  <p className="text-sm text-gray-400">{selectedTicket.address}</p>
                                </div>
                              </div>

                              {/* Ticket Info */}
                              <div className="flex items-start space-x-4 p-4 bg-gray-800/50 rounded-xl">
                                <TicketIcon className="w-6 h-6 text-purple-400 mt-1" />
                                <div>
                                  <h3 className="font-semibold text-white mb-1">Ticket Details</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-400">Seat:</span>
                                      <span className="text-gray-300 ml-2">{selectedTicket.seatNumber}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Price:</span>
                                      <span className="text-gray-300 ml-2">{selectedTicket.price ? format(selectedTicket.price) : 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Status:</span>
                                      <span className="text-green-400 ml-2">{selectedTicket.status}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Minted:</span>
                                      <span className="text-gray-300 ml-2">{formatDate(selectedTicket.mintDate)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Owner Info */}
                              <div className="flex items-start space-x-4 p-4 bg-gray-800/50 rounded-xl">
                                <User className="w-6 h-6 text-purple-400 mt-1" />
                                <div className="flex-1">
                                  <h3 className="font-semibold text-white mb-1">Owner Information</h3>
                                  <div className="text-sm space-y-1">
                                    <div className="mt-1 overflow-x-auto">
                                      <span className="text-purple-400 font-mono whitespace-nowrap">
                                        {selectedTicket.owner}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Network:</span>
                                      <span className="text-gray-300 ml-2">Avalanche C-Chain</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <p className="text-gray-400 text-sm">{selectedTicket.description}</p>
                            </div>

                            {/* QR Code & Actions */}
                            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                              {/* QR Code */}
                              <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 text-center">
                                <h3 className="text-sm sm:text-base font-semibold text-white mb-4 flex items-center justify-center">
                                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                  Entry QR Code
                                </h3>
                                <div className="bg-white p-3 sm:p-4 rounded-xl mb-4 inline-block">
                                  <img
                                    src={generateQRCode(selectedTicket)}
                                    alt="QR Code"
                                    className="w-24 h-24 sm:w-32 sm:h-32"
                                  />
                                </div>
                                <div className="text-xs text-gray-500 font-mono break-all">{selectedTicket.qrCode}</div>
                              </div>

                              {/* Actions */}
                              <div className="space-y-3">
                                <button
                                  onClick={handleDownloadTicket}
                                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-colors duration-300 flex items-center justify-center text-sm sm:text-base"
                                >
                                  <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                  Download Ticket
                                </button>
                                <button
                                  onClick={handleCommentOnEvent}
                                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-colors duration-300 flex items-center justify-center text-sm sm:text-base"
                                >
                                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                  Comment on Event
                                </button>
                                <button
                                  onClick={handleResellTicket}
                                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-colors duration-300 flex items-center justify-center text-sm sm:text-base"
                                >
                                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                  Resell Ticket
                                </button>
                                <button
                                  onClick={handleViewOnExplorer}
                                  className="w-full bg-green-700 hover:bg-green-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl transition-colors duration-300 flex items-center justify-center text-sm sm:text-base"
                                >
                                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                  View on Explorer
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TicketIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-bold mb-2 text-gray-400">No Tickets Found</h3>
                  <p className="text-gray-500 mb-6">
                    You don't have any tickets yet. Mint your first ticket!
                  </p>
                  <button
                    onClick={() => window.location.href = '/mint'}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl transition-colors duration-300"
                  >
                    Mint Ticket
                  </button>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
              <div className="flex items-center text-red-400">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Hidden Ticket Component for Generation */}
      <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
        <EventverseTicket ref={ticketRef} ticket={selectedTicket} />
      </div>
    </div >
  );
};

export default Ticket;

