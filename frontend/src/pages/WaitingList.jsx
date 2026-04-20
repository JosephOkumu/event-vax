import React, { useState, useEffect } from 'react';
import { Mail, Star, Users, ChevronRight, Zap } from 'lucide-react';


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
            background: `rgba(${Math.random() * 255}, ${Math.random() * 100 + 155}, 255, 0.6)`,
            animationDuration: `${Math.random() * 10 + 10}s`,
            animationDelay: `-${Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
};

const WaitlistPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleJoinWaitlist = () => {
    window.open('https://forms.gle/rABHhncF9CNrZNGc8', '_blank');
  };

  const stats = [
    { value: "5K+", label: "Users Waiting", icon: <Users className="w-6 h-6" /> },
    { value: "24h", label: "Avg Wait Time", icon: <Zap className="w-6 h-6" /> },
    { value: "100%", label: "Acceptance Rate", icon: <Star className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <ParticleField />

      <main className="relative pt-20 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`transition-all duration-1000 delay-300 
            ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            
            <div className="mb-8 inline-block">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur-xl 
                  group-hover:blur-2xl transition-all duration-300" />
                <div className="relative bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30 
                  px-6 py-2">
                  <span className="text-sm font-medium">Coming Soon</span>
                </div>
              </div>
            </div>

            <h1 className="text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Join the Future of Event Ticketing
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Be among the first to experience the next generation of event management. 
              Click below to join our exclusive waitlist and secure your early access to EventVerse.
            </p>

            {/* Join Waitlist Button */}
            <div className="mb-16">
              <button
                onClick={handleJoinWaitlist}
                className="group relative px-8 py-4 rounded-xl overflow-hidden transform hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 blur-xl 
                  group-hover:blur-2xl transition-all duration-300" />
                <div className="relative z-10 flex items-center space-x-2">
                  <span className="text-lg font-semibold">Join Waitlist</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 
                    rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  <div className="relative bg-black/40 backdrop-blur-xl rounded-xl border border-purple-500/30 
                    p-6 transform group-hover:translate-y-[-4px] transition-all duration-300">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                        {stat.icon}
                      </div>
                      <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 
                        bg-clip-text text-transparent mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WaitlistPage;