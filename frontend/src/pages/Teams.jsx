import React, { useState } from 'react';
import { 
  Github, 
  Linkedin, 
  Mail,
  Twitter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const AnimatedTeamSection = () => {
  const [activeIndex, setActiveIndex] = useState(1); // Start with middle card active
  const [isHovering, setIsHovering] = useState(false);

  const teamMembers = [
    {
      name: "John Mokaya",
      role: "Lead Developer",
      bio: "Passionate about creating seamless user experiences and solving complex problems.",
      image: "/src/assets/juni.png",
      social: {
        github: "https://github.com/mokayaj857",
        linkedin: "http://www.linkedin.com/in/john-mokaya-3b926a261",
        twitter: "http://x.com/BBjuniour",
        email: "mokayaj@ieee.org"
      }
    },
    {
      name: "Joseph Okumu",
      role: "Full-Stack Developer",
      bio: "Building sustainable solutions using technology.",
      image: "/src/assets/joseph.png",
      social: {
        github: "https://github.com/JosephOkumu",
        linkedin: "https://www.linkedin.com/in/JosephOkumu",
        twitter: "https://x.com/jaykush_0",
        email: "jokumu25@gmail.com"
      }
    },
    {
      name: "Williams Otieno",
      role: "Backend Developer",
      bio: "Driving innovation and ensuring our solutions meet real-world needs.",
      image: "/src/assets/ser.png",
      social: {
        github: "https://github.com/Savville",
        linkedin: "www.linkedin.com/in/williams-otieno-miee-maces-b358ab33b",
        twitter: "#",
        email: "ochiwilliamotieno@gmail.com"
      }
    }
  ];

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % teamMembers.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
  };

  return (
    <section className="relative bg-black/90 overflow-hidden py-24">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
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

      {/* Section Header */}
      <div className="relative max-w-7xl mx-auto px-6 mb-16 text-center">
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r 
          from-purple-400 to-blue-400 mb-4 animate-fade-in">
          Meet Our Team
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto animate-slide-up">
          The talented individuals behind our success, working together to deliver exceptional experiences.
        </p>
      </div>

      {/* Team Cards Container */}
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="relative h-[600px] flex items-center justify-center">
          {/* Navigation Buttons */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 z-20 p-3 bg-purple-600/20 rounded-full hover:bg-purple-600/40 
              transition-all duration-300 group"
          >
            <ChevronLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={nextSlide}
            className="absolute right-4 z-20 p-3 bg-purple-600/20 rounded-full hover:bg-purple-600/40 
              transition-all duration-300 group"
          >
            <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Team Cards */}
          <div className="relative w-full h-full flex items-center justify-center">
            {teamMembers.map((member, index) => {
              const isActive = index === activeIndex;
              const offset = index - activeIndex;
              
              return (
                <div
                  key={index}
                  className={`absolute w-80 transition-all duration-500 ease-out`}
                  style={{
                    transform: `translateX(${offset * 120}%) scale(${isActive ? 1 : 0.8}) 
                      translateZ(${isActive ? 0 : -100}px)`,
                    zIndex: isActive ? 10 : 5,
                    opacity: Math.abs(offset) > 1 ? 0 : 1,
                  }}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <div className={`relative group ${isActive ? 'cursor-default' : 'cursor-pointer'}`}>
                    {/* Card Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 
                      rounded-2xl backdrop-blur-sm group-hover:from-purple-600/20 group-hover:to-blue-600/20 
                      transition-all duration-500" />
                    
                    {/* Card Content */}
                    <div className="relative p-6 space-y-4">
                      {/* Image Container */}
                      <div className="relative w-48 h-48 mx-auto mb-6 group-hover:scale-105 
                        transition-transform duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 
                          rounded-full opacity-75 animate-pulse" />
                        <img
                          src={member.image}
                          alt={member.name}
                          className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] rounded-full 
                            object-cover border-4 border-black"
                        />
                      </div>

                      {/* Member Info */}
                      <div className="text-center transform transition-all duration-500">
                        <h3 className="text-xl font-semibold text-white mb-1 group-hover:scale-105">
                          {member.name}
                        </h3>
                        <p className="text-purple-400 font-medium mb-3">{member.role}</p>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          {member.bio}
                        </p>
                      </div>

                      {/* Social Links */}
                      {isActive && (
                        <div className="flex justify-center space-x-3 opacity-0 group-hover:opacity-100 
                          transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                          {[
                            { Icon: Github, link: member.social.github },
                            { Icon: Linkedin, link: member.social.linkedin },
                            { Icon: Twitter, link: member.social.twitter },
                            { Icon: Mail, link: `mailto:${member.social.email}` }
                          ].map(({ Icon, link }, socialIndex) => (
                            <a
                              key={socialIndex}
                              href={link}
                              className="group relative p-2"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 
                                rounded-lg opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 
                                transition-all duration-300" />
                              <Icon className="w-5 h-5 relative z-10 text-gray-400 group-hover:text-white 
                                transition-colors" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedTeamSection;
