import React, { useState } from 'react';
import { ethers } from 'ethers';
import { EventFactoryABI } from '../abi';
import { CONTRACTS } from '../config/contracts';

const CreateEvent = () => {
  const [eventData, setEventData] = useState({
    name: '',
    date: '',
    description: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData({
      ...eventData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Request access to MetaMask
      if (!window.ethereum) {
        alert('MetaMask is not installed. Please install it to use this feature.');
        return;
      }

      // Connect to the provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Connect to the contract
      const contract = new ethers.Contract(CONTRACTS.EVENT_FACTORY, EventFactoryABI.abi, signer);

      // Send the transaction to the blockchain
      const tx = await contract.createEvent(
        eventData.name,
        eventData.date,
        eventData.description
      );

      console.log('Transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction mined:', receipt);

      alert('Event created successfully on the blockchain!');
      setEventData({ name: '', date: '', description: '' });
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create the event. See console for details.');
    }
  };


  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-3xl font-semibold text-gray-800 text-center mb-6">Create Event</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="name">Event Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={eventData.name}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Enter event name"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="date">Event Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={eventData.date}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="description">Event Description</label>
          <textarea
            id="description"
            name="description"
            value={eventData.description}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Enter event description"
            required
          />
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="bg-purple-500 text-white py-2 px-6 rounded-md hover:bg-purple-600 transition duration-300"
          >
            Create Event
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;
