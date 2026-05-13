import React, { useState, useEffect, useRef } from 'react';
import { Moon, Ticket, Calendar, Users, TrendingUp, ChevronRight, Star, Zap, Activity, Globe, Power, Clock, ArrowRight, Plus } from 'lucide-react';
import bitcoinImage from "../assets/EventVerse Tickets.jpg";
import Chatbit from './Chatbit';
import Testimonials from './Testimonials';
import Discover from './Discover';
// Footer is now handled elsewhere in the application
import Teams from './Teams';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useCurrency } from '../utils/currency.jsx';

// Avalanche Network Configuration
const AVALANCHE_MAINNET_PARAMS = {
  chainId: '0xA86A', // Hex chain ID for Avalanche Mainnet
  chainName: 'Avalanche Mainnet',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18
  },
  rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://snowtrace.io/']
};

const addAvalancheNetwork = async () => {
  if (typeof window.ethereum !== "undefined") {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [AVALANCHE_MAINNET_PARAMS],
      });
      console.log("Avalanche network added successfully!");
    } catch (error) {
      console.error("Error adding Avalanche network:", error);
    }
  } else {
    console.error("MetaMask is not installed.");
  }
};

const ParticleField = () => {
  return (
    <div className="fixed inset-0 opacity-30">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            background: `rgba(147, 51, 234, 0.6)`, // Solid purple
            animationDuration: `${Math.random() * 10 + 10}s`,
            animationDelay: `-${Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
};

const AnimatedCard = ({ children, delay, onClick, isSelected }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative group transition-all duration-300 transform 
        ${isSelected ? 'scale-105 -translate-y-1' : ''} 
        ${isHovered ? 'translate-y-[-4px]' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-purple-600/20 rounded-lg blur-lg
        group-hover:blur-xl transition-all duration-300" />
      <div className="relative bg-black/40 backdrop-blur-xl rounded-lg border border-purple-500/30
        group-hover:border-purple-500/50 p-3 transition-all duration-300">
        {children}
      </div>
    </div>
  );
};

const UltimateEventPlatform = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeStat, setActiveStat] = useState(null);
  const { walletAddress, isConnecting, connectWallet, isConnected } = useWallet();
  const { convert, format } = useCurrency();
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [activeEventFilter, setActiveEventFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true);
      const response = await fetch('http://localhost:8080/api/events');
      const result = await response.json();

      if (result.success) {
        const validEvents = result.data.filter(event => {
          // Filter out corrupted events (generic names, no prices, "Blockchain Event" venue)
          const isCorrupted = (
            event.event_name?.startsWith('Event #') &&
            event.venue === 'Blockchain Event' &&
            (!event.regular_price || event.regular_price === '0' || event.regular_price === '0.0')
          );
          
          return !isCorrupted;
        });
        
        setEvents(validEvents);
      } else {
        console.error('Failed to fetch events:', result.error);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const getFilteredEvents = () => {
    const now = new Date();
    
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      const isPast = eventDate < now;
      const isUpcoming = eventDate > now;
      const isOngoing = Math.abs(eventDate - now) < 24 * 60 * 60 * 1000; // Within 24 hours
      
      switch (activeEventFilter) {
        case 'upcoming':
          return isUpcoming && !isOngoing;
        case 'ongoing':
          return isOngoing;
        case 'past':
          return isPast;
        case 'all':
        default:
          return true;
      }
    });
  };



  const features = [
    {
      icon: <Ticket className="w-8 h-8" />,
      title: "Quantum Ticketing",
      description: "Next-gen blockchain verification with quantum security In less than 2 seconds only on Avalance ",
      color: "purple-600"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Maximizing Saving on Events",
      description: "Leveraging Avalanche's Low Fees for More Affordable Event Ticketing",
      color: "purple-600"
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: "Your Tickets, Your Security",
      description: "Safeguard Your Tickets with Avalanche's Trusted Blockchain Technology",
      color: "purple-600"
    }
  ];

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setShowSignInPrompt(false);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert(error.message || "Failed to connect wallet");
    }
  };

  const handleProtectedNavigation = (path) => {
    if (!isConnected || !walletAddress) {
      setShowSignInPrompt(true);
      return;
    }
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <ParticleField />

      {/* Dynamic Cursor Effect */}
      <div
        className="fixed w-64 h-64 pointer-events-none z-50 transition-transform duration-100"
        style={{
          transform: `translate(${mousePosition.x - 128}px, ${mousePosition.y - 128}px)`,
        }}
      >
        <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Sign In Prompt Modal */}
      {showSignInPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-purple-500/30 max-w-md w-full mx-4 overflow-hidden">
            <div className="relative bg-purple-600/20 p-6 text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Power className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Sign In Required</h3>
              <p className="text-gray-300">Please sign in with your wallet to access this feature.</p>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 px-6 rounded-xl transition-colors duration-300 flex items-center justify-center space-x-2"
                >
                  <Power className="w-5 h-5" />
                  <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                </button>
                <button
                  onClick={() => setShowSignInPrompt(false)}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded-xl transition-colors duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Compact */}
      <main className="relative pt-16 pb-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className={`transition-all duration-1000 delay-300
            ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              <div className="overflow-hidden">
                <span className="inline-block animate-slide-up-fade">Experience</span>
              </div>
              <div className="overflow-hidden">
                <span className="inline-block animate-slide-up-fade delay-200">The Future of</span>
              </div>
              <div className="overflow-hidden">
                <span className="inline-block text-purple-400 animate-slide-up-fade delay-400">
                  Event Ticketing
                </span>
              </div>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 mb-6 opacity-0 animate-fade-in delay-700">
              Step into a world where events transcend reality. Experience seamless ticketing,
              immersive venues, and next-generation event management.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => handleProtectedNavigation('/Myevent')}
                className="group relative px-4 py-2 text-sm rounded-lg overflow-hidden w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-purple-600" />
                <div className="absolute inset-0 bg-purple-600 blur-xl
                  group-hover:blur-2xl transition-all duration-300" />
                <div className="relative z-10 flex items-center justify-center space-x-2">
                  <span className="relative text-white font-medium flex items-center space-x-2">
                    <Plus className="w-3 h-3" />
                    <span>Create Event</span>
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleProtectedNavigation('/ticket')}
                className="group relative px-4 py-2 text-sm rounded-lg overflow-hidden w-full sm:w-auto"
              >
                <div className="absolute inset-0 border border-purple-500 rounded-lg" />
                <div className="absolute inset-0 bg-purple-500/10
                  transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 z-20 md:z-0" />
                <span className="relative z-10">Tickets Collection</span>
              </button>
            </div>
          </div>

          <div className={`relative transition-all duration-1000 delay-500
            ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            <div className="relative w-full h-48 sm:h-56 md:h-64 group">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 bg-purple-500 rounded-2xl
                    opacity-20 blur-2xl group-hover:blur-xl transition-all duration-500"
                  style={{
                    transform: `rotate(${i * 30}deg)`,
                    animationDelay: `${i * 200}ms`
                  }}
                />
              ))}
              <img
                src={bitcoinImage}
                alt="VR Experience"
                className="relative z-10 w-full h-full object-cover rounded-2xl transform
                  group-hover:scale-105 group-hover:rotate-3 transition-all duration-700"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Events Section - Compact */}
      <section id="events-section" className="py-12 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Discover Amazing Events
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 px-4">Secure, transparent, and efficient event ticketing powered by Avalanche blockchain</p>

            {/* Filter Tags */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['all', 'upcoming', 'ongoing', 'past'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveEventFilter(filter)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-full transition-all duration-300 capitalize
                    ${activeEventFilter === filter
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {isLoadingEvents ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-purple-400">Loading events...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getFilteredEvents().length > 0 ? (
                getFilteredEvents().map((event, index) => {
                const eventDate = new Date(event.event_date);
                const formattedDate = eventDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <div
                    onClick={() => handleProtectedNavigation(`/mint?eventId=${event.id}`)}
                    key={event.id}
                    className="group relative transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 cursor-pointer"
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    <div className="relative bg-black/40 backdrop-blur-xl rounded-lg border border-purple-500/30 overflow-hidden">
                      {event.flyer_image ? (
                        <img
                          src={event.flyer_image.startsWith('data:') ? event.flyer_image : event.flyer_image}
                          alt={event.event_name}
                          className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-purple-300" />
                        </div>
                      )}
                      <div className="p-3">
                        <h3 className="text-sm font-semibold mb-1 truncate">{event.event_name}</h3>
                        <div className="flex items-center space-x-1 text-gray-400 mb-2">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{formattedDate}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-purple-400">
                            {format(event.regular_price || event.vip_price || event.vvip_price || '0.0')}
                          </span>
                        </div>
                        {event.venue && (
                          <div className="text-xs text-gray-400 truncate">
                            📍 {event.venue}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })) : (
                <div className="col-span-full text-center py-20">
                  <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No upcoming events available</p>
                  <button
                    onClick={() => handleProtectedNavigation('/Myevent')}
                    className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
                  >
                    Create Your First Event
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section - Compact */}
      <section className="py-8 px-4 relative">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <AnimatedCard
              key={index}
              delay={index * 100}
              isSelected={selectedFeature === index}
              onClick={() => setSelectedFeature(index)}
            >
              <div className={`relative group-hover:scale-105 transition-transform duration-300`}>
                <div className={`w-10 h-10 mb-3 rounded-lg bg-${feature.color}
                  flex items-center justify-center transform group-hover:rotate-12 transition-all duration-300`}>
                  <div className="w-5 h-5">{feature.icon}</div>
                </div>
                <h3 className="text-sm sm:text-base font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* Interactive Stats - Compact */}
      <section className="py-8 px-4 relative">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { value: "100K+", label: "Active Users", icon: <Users className="w-4 h-4" />, color: "purple" },
            { value: "50K+", label: "Events Hosted", icon: <Calendar className="w-4 h-4" />, color: "blue" },
            { value: "1M+", label: "Tickets Sold", icon: <Ticket className="w-4 h-4" />, color: "purple" },
            { value: "99%", label: "Security Assurance", icon: <Star className="w-4 h-4" />, color: "blue" }
          ].map((stat, index) => (
            <div
              key={index}
              className="relative group cursor-pointer"
              onMouseEnter={() => setActiveStat(index)}
              onMouseLeave={() => setActiveStat(null)}
            >
              <div className={`absolute inset-0 bg-${stat.color}-500/20
                rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-all duration-300`} />
              <div className="relative bg-black/40 backdrop-blur-xl rounded-lg border border-purple-500/30
                group-hover:border-purple-500/50 p-3 sm:p-4 transform group-hover:translate-y-[-4px]
                transition-all duration-300">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full bg-${stat.color}-500/20
                    flex items-center justify-center mb-2 transform group-hover:scale-110
                    group-hover:rotate-12 transition-all duration-300`}>
                    {stat.icon}
                  </div>
                  <div className={`text-base sm:text-lg font-bold text-${stat.color}-400 mb-1`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors text-center">
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="py-8">
        <div>
          <Chatbit />
        </div>
      </section>
      {/* <section className="py-8">
        <div>
          <Testimonials />
        </div>
      </section>
      <section className="py-8">
        <div>
          <Discover />
        </div>
      </section>
      <section className="py-8">
        <div>
          <Teams />
        </div>
      </section> */}
      {/* Footer section removed to fix duplicate footer issue */}
    </div>
  );
};

export default UltimateEventPlatform;
