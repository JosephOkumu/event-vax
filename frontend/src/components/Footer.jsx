import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Github,
  Phone,
  MapPin,
  ArrowUp,
  Heart

} from 'lucide-react';

// This footer is now an exact copy of the landing page's footer markup
const AnimatedFooter = () => {
  const navigate = useNavigate();
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [isNewsletterFocused, setIsNewsletterFocused] = useState(false);

  const quickLinks = [
    { name: 'Events', action: 'scroll' },
    { name: 'Create Event', path: '/Myevent' },
    { name: 'My Tickets', path: '/ticket' },
    { name: 'Profile', path: '/profile' }
  ];

  const handleLinkClick = (item) => {
    if (item.action === 'scroll') {
      navigate('/');
      setTimeout(() => {
        document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(item.path);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-black/90 border-t border-purple-500/20 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full mix-blend-screen animate-float-slow"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, rgba(147,51,234,0.1) 0%, rgba(0,0,0,0) 70%)`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${20 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 group">
              <div className="w-8 h-8 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg 
                  group-hover:scale-110 group-hover:rotate-180 transition-all duration-700" />
                <div className="absolute inset-1 bg-black rounded-md" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">E</span>
                </div>
              </div>
              <span className="text-base sm:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r
                from-purple-400 to-blue-400">EventVerse</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Revolutionizing event experiences through blockchain technology.
            </p>
            <div className="flex space-x-2">
              {[Twitter, Instagram, Linkedin, Github].map((Icon, index) => (
                <button
                  key={index}
                  className="group relative p-1.5"
                  onMouseEnter={() => setHoveredIcon(index)}
                  onMouseLeave={() => setHoveredIcon(null)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-md 
                    opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300`} />
                  <Icon className="w-4 h-4 relative z-10 text-gray-400 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleLinkClick(item)}
                    className="group relative text-xs text-gray-400 hover:text-white transition-colors"
                    onMouseEnter={() => setHoveredLink(index)}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    <span className="relative">
                      {item.name}
                      <span className="absolute left-0 bottom-0 w-0 h-px bg-gradient-to-r from-purple-500 to-blue-500 
                        group-hover:w-full transition-all duration-300" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Contact Us</h3>
            <ul className="space-y-2">
              {[
                { Icon: Mail, text: 'mokayaj@ieee.org' },
                { Icon: Phone, text: '+254 746 271 36' },
                { Icon: MapPin, text: 'Nairobi, Kenya' }
              ].map(({ Icon, text }, index) => (
                <li key={index} className="flex items-center space-x-2 group">
                  <Icon className="w-3 h-3 text-purple-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors break-all">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Newsletter</h3>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                className={`w-full bg-purple-900/20 border border-purple-500/30 rounded-md px-3 py-2 
                  text-xs text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all
                  ${isNewsletterFocused ? 'border-purple-500 shadow-lg shadow-purple-500/20' : ''}`}
                onFocus={() => setIsNewsletterFocused(true)}
                onBlur={() => setIsNewsletterFocused(false)}
              />
              <button className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 bg-gradient-to-r 
                from-purple-600 to-blue-600 rounded text-xs text-white hover:from-purple-500 
                hover:to-blue-500 transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-purple-500/20 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400 text-center sm:text-left">
            © 2025 EventVerse. Made with <Heart className="inline-block w-3 h-3 text-red-500 animate-pulse" />
            by our team
          </p>
          <button
            onClick={scrollToTop}
            className="group p-1.5 bg-purple-900/20 rounded-md hover:bg-purple-900/40 transition-all"
          >
            <ArrowUp className="w-4 h-4 text-purple-400 group-hover:text-purple-300
              group-hover:-translate-y-1 transition-all" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default AnimatedFooter;