import React, { useState, useEffect } from 'react';
import { 
  Users, Mail, Linkedin, Twitter, ChevronRight,
  Code, Palette, ChartBar, Megaphone, Shield
} from 'lucide-react';

const TeamMember = ({ member, index, isVisible }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`transform transition-all duration-1000 cursor-pointer
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
        ${isHovered ? 'scale-105' : 'scale-100'}`}
      style={{ transitionDelay: `${index * 200}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative group">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 
          rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
        
        {/* Card Content */}
        <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 
          group-hover:border-purple-500/50 p-8 overflow-hidden">
          
          {/* Role Icon */}
          <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-gradient-to-r 
            from-purple-600/20 to-blue-600/20 flex items-center justify-center
            group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
            {member.icon}
          </div>
          
          {/* Profile Image */}
          <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden
            group-hover:scale-105 transition-transform duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 
              opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
            <img 
              src={`/api/placeholder/${200}/${200}`}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Name and Role */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 
              bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-blue-300 
              transition-all duration-300">
              {member.name}
            </h3>
            <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
              {member.role}
            </p>
          </div>
          
          {/* Skills */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {member.skills.map((skill, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1 rounded-full text-sm bg-purple-500/10 border border-purple-500/20
                    group-hover:bg-purple-500/20 group-hover:border-purple-500/30 transition-all duration-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          {/* Social Links */}
          <div className="flex justify-center space-x-4">
            {['mail', 'linkedin', 'twitter'].map((platform, idx) => (
              <button 
                key={platform}
                className="p-2 rounded-full bg-purple-500/10 hover:bg-purple-500/20 
                  transform hover:scale-110 transition-all duration-300"
                style={{ transitionDelay: `${idx * 50}ms` }}
              >
                {platform === 'mail' && <Mail className="w-5 h-5" />}
                {platform === 'linkedin' && <Linkedin className="w-5 h-5" />}
                {platform === 'twitter' && <Twitter className="w-5 h-5" />}
              </button>
            ))}
          </div>

          {/* Hover Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-blue-600/0 
            group-hover:from-purple-600/5 group-hover:to-blue-600/5 transition-all duration-500 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

const AnimatedTeamPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const teamMembers = [
    {
      name: "Sarah Mitchell",
      role: "Chief Technology Officer",
      icon: <Code className="w-6 h-6" />,
      skills: ["Technical Leadership", "System Architecture", "Innovation Strategy"]
    },
    {
      name: "Alex Chen",
      role: "Lead Designer",
      icon: <Palette className="w-6 h-6" />,
      skills: ["UI/UX Design", "Brand Identity", "Motion Design"]
    },
    {
      name: "Marcus Johnson",
      role: "Data Analytics Lead",
      icon: <ChartBar className="w-6 h-6" />,
      skills: ["Data Science", "Machine Learning", "Business Intelligence"]
    },
    {
      name: "Emma Rodriguez",
      role: "Marketing Director",
      icon: <Megaphone className="w-6 h-6" />,
      skills: ["Digital Marketing", "Brand Strategy", "Content Creation"]
    },
    {
      name: "David Kim",
      role: "Security Engineer",
      icon: <Shield className="w-6 h-6" />,
      skills: ["Cybersecurity", "Risk Management", "Cloud Security"]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Particle Background */}
      <div className="fixed inset-0 opacity-30">
        {[...Array(30)].map((_, i) => (
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

      {/* Mouse Follow Effect */}
      <div 
        className="fixed w-64 h-64 pointer-events-none z-10 transition-transform duration-100"
        style={{
          transform: `translate(${mousePosition.x - 128}px, ${mousePosition.y - 128}px)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-20">
        {/* Header Section */}
        <div className="text-center pt-20 pb-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className={`text-5xl font-bold mb-6 transition-all duration-1000 
              ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Meet Our Exceptional Team
              </span>
            </h1>
            <p className={`text-xl text-gray-400 transition-all duration-1000 delay-300
              ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
              A diverse group of passionate individuals working together to create extraordinary experiences
            </p>
          </div>
        </div>

        {/* Team Grid */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <TeamMember 
                key={index}
                member={member}
                index={index}
                isVisible={isVisible}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedTeamPage;