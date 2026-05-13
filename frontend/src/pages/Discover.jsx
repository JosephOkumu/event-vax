import React, { useState, useEffect } from 'react';
import { Shield, Wallet, QrCode, Ticket, Calendar, Users, ChevronDown, Sparkles, Star } from 'lucide-react';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleMouseMove = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const faqData = [
    {
      question: "How does blockchain ensure my ticket is authentic?",
      answer: "Each ticket is minted as a unique token on the blockchain with a verifiable history of ownership. This creates an immutable record that prevents counterfeiting and allows easy verification of authenticity through our system.",
      icon: Shield,
      accent: "#351d4f"
    },
    {
      question: "Can I resell my ticket safely?",
      answer: "Yes! Our blockchain-based system enables secure peer-to-peer transfers. All resales are recorded on-chain, ensuring transparency and preventing double-selling. Price caps can be implemented to prevent scalping.",
      icon: Wallet,
      accent: "#261b38"
    },
    {
      question: "How do I verify my ticket at the event?",
      answer: "Each ticket includes a unique QR code that links to its blockchain record. Event staff can scan this code using our verification app to instantly confirm the ticket's validity and your ownership.",
      icon: QrCode,
      accent: "rgb(53,29,79)"
    },
    {
      question: "What happens if I lose access to my ticket?",
      answer: "Since your ticket is stored on the blockchain and linked to your wallet, you can always recover it by logging in with your credentials. The ticket's ownership is permanently recorded and can't be lost.",
      icon: Ticket,
      accent: "#351d4f"
    },
    {
      question: "How do event organizers issue tickets?",
      answer: "Organizers can easily mint tickets through our platform, setting quantities, prices, and transfer rules. Each ticket is automatically generated as a unique token with built-in smart contract functionality.",
      icon: Calendar,
      accent: "#261b38"
    },
    {
      question: "Can groups buy tickets together?",
      answer: "Yes! Our system supports bulk purchases and group allocations. The blockchain ensures each ticket in the group is uniquely identifiable while maintaining the connection between group members.",
      icon: Users,
      accent: "#07060e"
    }
  ];

  return (
    <div className={`w-full max-w-4xl mx-auto p-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="relative p-8 rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-full h-full bg-gradient-to-br from-[#351d4f]/10 via-[#261b38]/10 to-[#07060e]/10" />
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#351d4f]/10 rounded-full filter blur-xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#261b38]/10 rounded-full filter blur-xl animate-pulse delay-1000" />
        </div>

        {/* Header section */}
        <div className="relative mb-12 text-center">
          <h2 className="text-4xl font-bold text-[#351d4f] mb-2">
            Frequently Asked Questions
          </h2>
          <div className="flex justify-center gap-2">
            <Star className="w-5 h-5 text-[#351d4f] animate-spin-slow" />
            <Star className="w-5 h-5 text-[#261b38] animate-bounce" />
            <Star className="w-5 h-5 text-[#351d4f] animate-spin-slow" />
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-6 relative z-10">
          {faqData.map((faq, index) => {
            const isActive = activeIndex === index;
            const isHovered = hoveredIndex === index;
            const Icon = faq.icon;

            return (
              <div
                key={index}
                className={`transform transition-all duration-500 ease-out ${
                  isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
                }`}
                style={{ 
                  transitionDelay: `${index * 150}ms`,
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onMouseMove={(e) => handleMouseMove(e, index)}
              >
                <div
                  className={`relative rounded-xl transition-all duration-500 ${
                    isActive ? 'ring-2 ring-[#351d4f]' : 'ring-1 ring-[#351d4f]/20'
                  }`}
                >
                  {/* Hover effect background */}
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 rounded-xl"
                    style={{
                      opacity: isHovered ? 0.1 : 0,
                      background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, ${faq.accent} 0%, transparent 70%)`
                    }}
                  />

                  <button
                    className={`w-full p-6 flex items-center justify-between transition-all duration-300 ${
                      isActive ? 'bg-[#351d4f]/5' : 'bg-white hover:bg-[#351d4f]/5'
                    }`}
                    onClick={() => setActiveIndex(isActive ? null : index)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl transition-all duration-500 ${
                          isActive ? 'bg-[#351d4f] rotate-12' : 
                          isHovered ? 'bg-[#351d4f]/20 rotate-6' : 'bg-transparent'
                        }`}
                      >
                        <Icon 
                          className={`w-6 h-6 transition-all duration-500 ${
                            isActive ? 'text-white scale-110' : 
                            isHovered ? 'text-[#351d4f] scale-105' : 'text-[#351d4f]/60'
                          }`}
                        />
                      </div>
                      <span className={`font-semibold text-lg ${
                        isActive ? 'text-[#351d4f]' : 'text-black'
                      }`}>
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-6 h-6 transition-transform duration-500 ${
                        isActive ? 'rotate-180 text-[#351d4f]' : 
                        isHovered ? 'rotate-90 text-[#351d4f]' : 'text-[#351d4f]/60'
                      }`}
                    />
                  </button>

                  <div
                    className={`transition-all duration-500 ease-in-out ${
                      isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="p-6 bg-gradient-to-br from-white to-[#351d4f]/5">
                      <p className="text-black leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FAQ;