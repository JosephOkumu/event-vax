import React, { useState, useEffect } from 'react';
import imImage from "../assets/im.png";
import Chatbit from './Chatbit';
import { 
  Ticket, 
  Wallet, 
  Plus, 
  ArrowRight, 
  ShoppingCart, 
  Clock,
  BarChart,
  RefreshCw,
  Shield
} from 'lucide-react';

const TokenizedTicketing = () => {
  const [selectedSection, setSelectedSection] = useState('buy');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const sampleEvents = [
   
    {
      id: 1,
      name: "Blockchain Summit 2025",
      date: "March 15, 2025",
      price: "0.5 AVAX",
      available: 150,
      total: 500,
      image: "/src/assets/imag.png"
    },
    {
      id: 2,
      name: "Web3 Music Festival",
      date: "April 20, 2025",
      price: "1.2 AVAX",
      available: 75,
      total: 1000,
      image: "/src/assets/dr.png"
    },
    {
      id: 3,
      name: "NFT Art Exhibition",
      date: "May 5, 2025",
      price: "0.8 AVAX",
      available: 200,
      total: 300,
      image: "/src/assets/im.png",
      url: "/src/pages/qrcode",
    }
    
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Feature Highlights */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 
            bg-clip-text text-transparent">
            Tokenized Ticketing on Avalanche
          </h2>
          <p className="text-xl text-gray-400">Secure, transparent, and efficient event ticketing powered by blockchain</p>
        </div>

        {/* Token Actions */}
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-4 mb-8">
            <a href="/Myevent" className="inline-block">
              <button className="relative px-6 py-3 rounded-xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative text-white font-medium">
                  Create Event
                </span>
                <div className="absolute inset-0 shadow-lg shadow-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </a>
          </div>

          {/* Event Cards */}
          <div className="grid grid-cols-3 gap-8">
            {sampleEvents.map((event, index) => (
              <div
                key={event.id}
                className={`group relative transition-all duration-500 transform 
                  hover:scale-105 hover:-translate-y-2`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 
                  rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="relative bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30 
                  overflow-hidden">
                  <img 
                    src={event.image} 
                    alt={event.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
                    <div className="flex items-center space-x-2 text-gray-400 mb-4">
                      <Clock className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-purple-400">{event.price}</span>
                      <a href='/mint'>
                      <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 
                        rounded-lg flex items-center space-x-2 group-hover:shadow-lg 
                        group-hover:shadow-purple-500/20 transition-all">
                        <span>{selectedSection === 'buy' ? 'Purchase' : 
                               selectedSection === 'create' ? 'Create' : 'Resell'}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                      </a>
                    </div>
                    <div className="mt-4 bg-purple-900/20 rounded-lg p-3">
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Available: {event.available}</span>
                        <span>Total Supply: {event.total}</span>
                      </div>
                      <div className="mt-2 h-2 bg-purple-900/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                          style={{ width: `${(event.available / event.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wallet Connection */}
      <div className="fixed bottom-6 right-6">
        <a href='/'>
        <button className="group px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl 
          flex items-center space-x-3 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
          <Wallet className="w-5 h-5" />
          <span>Connect Wallet</span>
          <section>
            <div>
              <Chatbit />
            </div>
          </section>
        </button>
        </a>
      </div>
    </div>
  );
};

export default TokenizedTicketing;

