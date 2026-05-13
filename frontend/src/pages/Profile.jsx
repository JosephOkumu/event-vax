import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Trophy, Ticket, Award, Calendar, ChevronDown, ChevronUp, 
  Star, Zap, Target, Gift, ExternalLink, Eye, BarChart3, DollarSign 
} from 'lucide-react';
import { useAchievements } from '../hooks/useAchievements';
import { useCurrency } from '../utils/currency.jsx';

const Profile = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userTickets, setUserTickets] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const { achievements, poaps, loading: achievementsLoading } = useAchievements(walletAddress);
  const { currency, changeCurrency } = useCurrency();
  const [expandedSections, setExpandedSections] = useState({
    achievements: false,
    tickets: false,
    poaps: false,
    events: true // Opened by default
  });

  useEffect(() => {
    setIsVisible(true);
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchUserTickets();
      fetchUserEvents();
    }
  }, [walletAddress]);

  const fetchUserTickets = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/tickets/wallet/${walletAddress}`);
      const result = await response.json();

      if (result.success && result.tickets.length > 0) {
        const formattedTickets = result.tickets.map((ticket) => ({
          id: ticket.id,
          eventName: ticket.event_name,
          date: new Date(ticket.event_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          status: 'Active',
          type: ['Regular', 'VIP', 'VVIP'][ticket.tier_id] || 'General'
        }));
        setUserTickets(formattedTickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const fetchUserEvents = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/events/creator/${walletAddress}`);
      const result = await response.json();

      if (result.success && result.events.length > 0) {
        // Filter out corrupted events
        const validEvents = result.events.filter(event => {
          const isCorrupted = (
            event.event_name?.startsWith('Event #') &&
            event.venue === 'Blockchain Event' &&
            (!event.regular_price || event.regular_price === '0' || event.regular_price === '0.0')
          );
          return !isCorrupted;
        });

        const formattedEvents = validEvents.map((event) => ({
          id: event.blockchain_event_id || event.id,
          name: event.event_name,
          date: new Date(event.event_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
          attendees: event.attendees || 0,
          status: new Date(event.event_date) > new Date() ? 'Upcoming' : 'Completed'
        }));
        setUserEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          navigate('/'); // Redirect if not connected
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Map icon names to components
  const iconMap = {
    Star, Zap, Target, Award, Gift
  };

  // User data with real achievements
  const userData = {
    achievements: achievements.map(ach => ({
      ...ach,
      icon: iconMap[ach.icon] || Star
    })),
    tickets: userTickets.length > 0 ? userTickets : [],
    poaps: poaps.length > 0 ? poaps : [],
    events: userEvents.length > 0 ? userEvents : []
  };

  const SectionHeader = ({ title, icon: Icon, isExpanded, onClick, count }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 sm:p-4 bg-black/40 backdrop-blur-xl
        rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300
        group"
    >
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-600/20 flex items-center justify-center
          group-hover:bg-purple-600/30 transition-all duration-300 flex-shrink-0">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
        </div>
        <div className="text-left">
          <h3 className="text-base sm:text-lg font-semibold text-white">{title}</h3>
          <p className="text-xs text-gray-400">{count} items</p>
        </div>
      </div>
      {isExpanded ? (
        <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Particle Background */}
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
              background: `rgba(147, 51, 234, 0.6)`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `-${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <main className="relative pt-20 sm:pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className={`transition-all duration-1000 mb-6 sm:mb-8
            ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-4 sm:p-6">
              <div className="flex items-center justify-between space-x-3 sm:space-x-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600
                    flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-blue-400
                      bg-clip-text text-transparent">
                      My Profile
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-mono truncate">
                      {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not Connected'}
                    </p>
                  </div>
                </div>
                {/* Currency Selector */}
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-400 hidden sm:block" />
                  <select
                    value={currency}
                    onChange={(e) => changeCurrency(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-black/60 border border-purple-500/30 
                      text-white text-sm focus:border-purple-500 focus:outline-none"
                  >
                    <option value="AVAX">AVAX</option>
                    <option value="USDT">USDT</option>
                    <option value="KSH">KSH</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Section */}
          <div className={`mb-4 transition-all duration-700 delay-100
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <SectionHeader
              title="Achievements"
              icon={Trophy}
              isExpanded={expandedSections.achievements}
              onClick={() => toggleSection('achievements')}
              count={userData.achievements.length}
            />
            {expandedSections.achievements && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3 sm:p-4 bg-black/20 backdrop-blur-xl
                rounded-lg border border-purple-500/20">
                {userData.achievements.map((achievement, index) => (
                  <div
                    key={achievement.id}
                    className="group relative p-3 sm:p-4 bg-black/40 backdrop-blur-xl rounded-lg border
                      border-purple-500/30 hover:border-purple-500/50 transition-all duration-300
                      hover:scale-105"
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-${achievement.color}-600/20
                      flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <achievement.icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${achievement.color}-400`} />
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1">{achievement.title}</h4>
                    <p className="text-xs text-gray-400">{achievement.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tickets Section */}
          <div className={`mb-4 transition-all duration-700 delay-200
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <SectionHeader
              title="My Tickets"
              icon={Ticket}
              isExpanded={expandedSections.tickets}
              onClick={() => toggleSection('tickets')}
              count={userData.tickets.length}
            />
            {expandedSections.tickets && (
              <div className="mt-2 space-y-2 p-4 bg-black/20 backdrop-blur-xl rounded-lg
                border border-purple-500/20">
                {userData.tickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="group flex items-center justify-between p-3 bg-black/40 backdrop-blur-xl
                      rounded-lg border border-purple-500/30 hover:border-purple-500/50
                      transition-all duration-300 hover:translate-x-1"
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{ticket.eventName}</h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{ticket.date}</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                            {ticket.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/ticket')}
                      className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30
                        border border-purple-500/30 text-xs text-purple-400 flex items-center space-x-1
                        transition-all duration-300"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => navigate('/ticket')}
                  className="w-full mt-2 py-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20
                    border border-purple-500/30 text-sm text-purple-400 flex items-center
                    justify-center space-x-2 transition-all duration-300"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View All Tickets</span>
                </button>
              </div>
            )}
          </div>

          {/* POAPs Section */}
          <div className={`mb-4 transition-all duration-700 delay-300
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <SectionHeader
              title="POAPs"
              icon={Award}
              isExpanded={expandedSections.poaps}
              onClick={() => toggleSection('poaps')}
              count={userData.poaps.length}
            />
            {expandedSections.poaps && (
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-black/20 backdrop-blur-xl
                rounded-lg border border-purple-500/20">
                {achievementsLoading ? (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    Loading POAPs from blockchain...
                  </div>
                ) : userData.poaps.length > 0 ? (
                  userData.poaps.map((poap, index) => (
                    <div
                      key={poap.id}
                      className="group p-4 bg-black/40 backdrop-blur-xl rounded-lg border
                        border-purple-500/30 hover:border-purple-500/50 transition-all duration-300
                        hover:scale-105"
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600
                          flex items-center justify-center">
                          <Gift className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{poap.name}</h4>
                          <p className="text-xs text-gray-400">{poap.event}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Token ID: #{poap.tokenId}</p>
                      <div className="mt-2 flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-400">On-Chain Verified</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    <Gift className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                    <p>No POAPs collected yet</p>
                    <p className="text-xs mt-1">Attend events to earn POAPs!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Events Section - Opened by default */}
          <div className={`mb-4 transition-all duration-700 delay-400
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <SectionHeader
              title="My Events"
              icon={Calendar}
              isExpanded={expandedSections.events}
              onClick={() => toggleSection('events')}
              count={userData.events.length}
            />
            {expandedSections.events && (
              <div className="mt-2 space-y-2 p-4 bg-black/20 backdrop-blur-xl rounded-lg
                border border-purple-500/20">
                {userData.events.map((event, index) => (
                  <div
                    key={event.id}
                    className="group flex items-center justify-between p-4 bg-black/40 backdrop-blur-xl
                      rounded-lg border border-purple-500/30 hover:border-purple-500/50
                      transition-all duration-300 hover:translate-x-1 cursor-pointer"
                    style={{ transitionDelay: `${index * 50}ms` }}
                    onClick={() => navigate(`/event-dashboard/${event.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-semibold text-white">{event.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          event.status === 'Upcoming'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{event.attendees} attendees</span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="ml-4 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500
                        text-white text-sm flex items-center space-x-2 transition-all duration-300
                        group-hover:scale-105"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className='hidden md:block'>Dashboard</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
