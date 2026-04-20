import React, { useEffect, useState } from "react";
import { Ticket, UserCircle, Plus, X, Calendar, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription } from "@radix-ui/react-alert-dialog";
import { Alert, AlertTitle } from "@mui/material";
import { Moon, Users, TrendingUp, ChevronRight, Star, Zap, Activity, Globe } from 'lucide-react';

export default function EventTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newTestimonial, setNewTestimonial] = useState({ quote: "", name: "", role: "", event: "" });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [notification, setNotification] = useState(null);
  const [testimonials, setTestimonials] = useState([
    {
      quote: "The blockchain verification saved me from buying counterfeit tickets. The QR code verification was instant and gave me complete peace of mind.",
      name: "Michael Otieno",
      role: "Concert Attendee",
      event: "Global Music Festival 2024",
      ticketsSaved: 3
    },
    {
      quote: "As an event organizer, this platform has eliminated ticket fraud completely. The blockchain tracking of transfers is a game-changer!",
      name: "Sarah Cherop",
      role: "Event Director",
      event: "Tech Summit 2024",
      ticketsSold: 5000
    },
    {
      quote: "Reselling my tickets was secure and transparent. No more worries about scams or double-selling. The smart contract handled everything!",
      name: "David Oigara",
      role: "Sports Fan",
      event: "Championship Finals",
      resaleValue: "2.5 ETH"
    },
    {
      quote: "The QR verification system worked flawlessly for our 10,000 attendee conference. Zero fraud cases reported!",
      name: "Emily Okumu",
      role: "Conference Organizer",
      event: "BlockchainCon 2024",
      fraudPrevented: "100%"
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTestimonial({ ...newTestimonial, [name]: value });
  };

  const handleAddTestimonial = () => {
    if (newTestimonial.quote && newTestimonial.name && newTestimonial.role && newTestimonial.event) {
      setTestimonials([...testimonials, newTestimonial]);
      setNewTestimonial({ quote: "", name: "", role: "", event: "" });
      setIsFormVisible(false);
      setNotification({
        type: "success",
        title: "Success!",
        message: "Thanks for sharing your experience!"
      });
    } else {
      setNotification({
        type: "error",
        title: "Error",
        message: "Please fill in all fields"
      });
    }
  };

  return (
    <section className="relative overflow-hidden px-6 py-24 bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      {/* Header Section */}
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-center gap-4 mb-12">
          <Ticket className="w-12 h-12 text-blue-400 animate-pulse" />
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Trusted by Event Lovers
          </h2>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-blue-900/30 p-6 rounded-xl border border-blue-500/20 text-center">
            <div className="text-3xl font-bold text-blue-400">100%</div>
            <div className="text-blue-200 text-sm">Verified Tickets</div>
          </div>
          <div className="bg-purple-900/30 p-6 rounded-xl border border-purple-500/20 text-center">
            <div className="text-3xl font-bold text-purple-400">0%</div>
            <div className="text-purple-200 text-sm">Fraud Rate</div>
          </div>
          <div className="bg-indigo-900/30 p-6 rounded-xl border border-indigo-500/20 text-center">
            <div className="text-3xl font-bold text-indigo-400">24/7</div>
            <div className="text-indigo-200 text-sm">Blockchain Verification</div>
          </div>
        </div>

        {/* Testimonials Scroll Section */}
        <div className="bg-black/20 rounded-xl backdrop-blur-sm border border-white/10">
          <div className="testimonials-container h-[600px] overflow-hidden relative">
            <div className="testimonials-scroll space-y-6 p-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-lg p-6 backdrop-blur-lg border border-white/10 hover:border-blue-500/50 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <UserCircle className="w-12 h-12 text-blue-400" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-white">{testimonial.name}</span>
                        <span className="text-blue-400">·</span>
                        <span className="text-blue-400">{testimonial.role}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{testimonial.event}</span>
                      </div>
                      <p className="text-gray-200">{testimonial.quote}</p>
                      {testimonial.ticketsSaved && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-green-900/20 text-green-400 px-3 py-1 rounded-full text-sm">
                          <Ticket className="w-4 h-4" />
                          {testimonial.ticketsSaved} tickets verified
                        </div>
                      )}
                      {testimonial.fraudPrevented && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-purple-900/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                          <MapPin className="w-4 h-4" />
                          {testimonial.fraudPrevented} fraud prevention
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Testimonial Button */}
        <div className="mt-8 flex justify-center">
          {!isFormVisible && (
            <button
              onClick={() => setIsFormVisible(true)}
              className="group relative px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 overflow-hidden"
            >
              <Plus className="w-5 h-5" />
              <span>Share Your Experience</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full duration-1000 transition-transform"></div>
            </button>
          )}
        </div>
      </div>

      {/* Testimonial Form Modal */}
      <AnimatePresence>
        {isFormVisible && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-md relative border border-blue-500/20"
            >
              <button
                onClick={() => setIsFormVisible(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-bold text-white mb-6">Share Your Event Experience</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  name="quote"
                  placeholder="Share your experience..."
                  value={newTestimonial.quote}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={newTestimonial.name}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <input
                  type="text"
                  name="role"
                  placeholder="Your Role (e.g., Event Organizer, Attendee)"
                  value={newTestimonial.role}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <input
                  type="text"
                  name="event"
                  placeholder="Event Name"
                  value={newTestimonial.event}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  onClick={handleAddTestimonial}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-300"
                >
                  Submit Your Story
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Alert */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Alert
              className={`w-96 ${
                notification.type === "success" ? "bg-green-500" : "bg-red-500"
              } text-white border-none`}
            >
              <AlertTitle>{notification.title}</AlertTitle>
              <AlertDescription>{notification.message}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <style>
        {`
          .testimonials-container::before,
          .testimonials-container::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            height: 100px;
            z-index: 1;
            pointer-events: none;
          }

          .testimonials-container::before {
            top: 0;
            background: linear-gradient(to bottom, rgb(17, 24, 39), transparent);
          }

          .testimonials-container::after {
            bottom: 0;
            background: linear-gradient(to top, rgb(17, 24, 39), transparent);
          }

          .testimonials-scroll {
            animation: scrollVertical 40s linear infinite;
          }

          .testimonials-scroll:hover {
            animation-play-state: paused;
          }

          @keyframes scrollVertical {
            0% { transform: translateY(0); }
            100% { transform: translateY(calc(-50% - 1rem)); }
          }
        `}
      </style>
    </section>
  );
}