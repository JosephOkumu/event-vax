import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';

const ChatbotInterface = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      text: "Hi there! I'm the EventVax assistant. How can I help you with event tickets today?", 
      sender: 'bot' 
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to the bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    // Add user message to chat
    const userMessage = { text: inputMessage, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Send request to the chatbot API
      const response = await fetch('http://localhost:3001/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      // Add bot response to chat
      const botMessage = { text: data.response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      // Add error message
      const errorMessage = { 
        text: "Sorry, I'm having trouble connecting right now. Please try again later.", 
        sender: 'bot',
        isError: true 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-all z-50"
        aria-label="Toggle chat"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
      
      {/* Chat Interface */}
      <div className={`fixed bottom-24 right-6 w-96 bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 z-50 transform ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
      }`}>
        {/* Chat Header */}
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
          <h2 className="font-bold">EventVax Assistant</h2>
          <button onClick={toggleChat} className="text-white hover:text-purple-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 max-w-[80%] ${
                message.sender === 'user' ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div className={`p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-none'
                  : message.isError
                    ? 'bg-red-100 text-red-800 rounded-tl-none'
                    : 'bg-gray-200 text-gray-800 rounded-tl-none'
              }`}>
                {message.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="mb-4 max-w-[80%] mr-auto">
              <div className="p-3 rounded-lg bg-gray-200 text-gray-800 rounded-tl-none">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-purple-600 text-white p-2 rounded-r-lg hover:bg-purple-700 transition"
              disabled={isLoading}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChatbotInterface;
