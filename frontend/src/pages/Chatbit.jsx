import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import neuralImage from "../assets/botImage.png"; // This image needs to exist in your assets folder

const Chatbit = () => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [messages, setMessages] = useState([]); // Chat messages
  const [input, setInput] = useState(""); // User input
  const [isLoading, setIsLoading] = useState(false);

  // Send message to the backend API and get response
  const sendMessageToBackend = async (message) => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8080/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      return data.response;
      
    } catch (error) {
      console.error('Error sending message to API:', error);
      return "Sorry, I'm having trouble connecting to the server right now. Please try again later.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === "") return;

    // Append user message
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    
    const inputCopy = input;
    setInput(""); // Clear input field

    // Add typing indicator
    setMessages((prev) => [...prev, { sender: "ai", isTyping: true }]);

    // Get response from backend
    const aiResponse = await sendMessageToBackend(inputCopy);
    
    // Remove typing indicator and add actual response
    setMessages((prev) => prev.filter(msg => !msg.isTyping));
    setMessages((prev) => [...prev, { sender: "ai", text: aiResponse }]);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Floating Button */}
      <motion.div
        className="group w-16 h-16 bg-white border-2 border-blue-500 rounded-full shadow-2xl flex items-center justify-center cursor-pointer relative overflow-hidden"
        whileHover={{
          scale: 1.2,
          rotate: 10,
          boxShadow: "0px 0px 15px rgba(0, 123, 255, 0.6)",
        }}
        transition={{ type: "spring", stiffness: 300 }}
        onClick={() => setIsPopupVisible(true)}
        title="Chat with AI"
      >
        <img
          src={neuralImage}
          alt="AI Icon"
          className="w-12 h-12 object-contain group-hover:scale-110"
        />
      </motion.div>

      {/* Chat Box */}
      {isPopupVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="fixed bottom-20 right-8 bg-gradient-to-b from-white to-blue-50 p-6 shadow-2xl rounded-lg w-80 z-50 border border-blue-300"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-lg font-bold text-blue-600 flex items-center">
              <span className="mr-2">🤖</span> EventVerse Assistant
            </h3>
            <button
              className="text-red-500 font-bold hover:text-red-700 transition"
              onClick={() => setIsPopupVisible(false)}
            >
              ✖
            </button>
          </div>

          {/* Chat Messages */}
          <div
            className="mt-4 h-48 overflow-y-auto bg-white rounded-lg p-3 shadow-inner"
            style={{ maxHeight: "200px" }}
          >
            {messages.length === 0 ? (
              <p className="text-gray-400 text-center">
                I'm ready to help! Ask me anything about EventVax tickets!
              </p>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: message.sender === "user" ? 100 : -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`my-2 ${
                    message.sender === "user"
                      ? "text-right text-blue-600"
                      : "text-left text-purple-600"
                  }`}
                >
                  {message.isTyping ? (
                    <div className="inline-block px-3 py-2 rounded-lg shadow-md bg-purple-100">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  ) : (
                    <p
                      className={`inline-block px-3 py-2 rounded-lg shadow-md ${
                        message.sender === "user"
                          ? "bg-blue-100"
                          : "bg-purple-100"
                      }`}
                    >
                      {message.text}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Input Field */}
          <div className="mt-3 flex">
            <input
              type="text"
              className="flex-1 border border-blue-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black bg-white overflow-visible"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isLoading}
            />
            <button
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-r-lg shadow-md hover:scale-105 active:scale-95 transition"
              onClick={handleSendMessage}
              disabled={isLoading}
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Chatbit;