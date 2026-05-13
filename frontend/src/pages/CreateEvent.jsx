import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Chatbit from './Chatbit';
import { useCurrency } from '../utils/currency.jsx';

import contractABI from "../../../../../../../src/abi/Ticket.json";    
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS; //<---add address here

const CreateEvent = () => {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const { currency, toAVAX, format } = useCurrency();
  const [eventData, setEventData] = useState({
    name: '',
    date: '',
    venue: '',
    ticketPrice: '',
    totalTickets: '',
  });

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          // Request access to MetaMask
          await window.ethereum.request({ method: 'eth_requestAccounts' });

          // Create a provider and signer
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = web3Provider.getSigner();

          const ticketContract = new ethers.Contract(contractAddress, contractABI, signer);

          setProvider(web3Provider);
          setContract(ticketContract);

          // Get connected account
          const accounts = await web3Provider.listAccounts();
          setAccount(accounts[0]);

          // Listen for network changes
          provider.on("network", (newNetwork, oldNetwork) => {
            if (oldNetwork) {
              window.location.reload();
            } else {
              console.log("Network changed to", newNetwork.name);
            }
          });

          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0]);
          });
        } catch (error) {
          console.error('Error initializing contract:', error);
        }
      }
    };
    init();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contract || !account) {
      alert("Please connect your wallet first!");
      return
    }

    try {
      // Convert price to AVAX (wei) regardless of display currency
      const priceInAVAX = toAVAX(eventData.ticketPrice);
      const priceInWei = ethers.parseEther(priceInAVAX);

      // Connect to the provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Connect to the contract
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Send the transaction to the blockchain
      const tx = await contract.createEvent(
        eventData.name,
        eventData.date,
        eventData.venue,
        priceInWei,
        eventData.totalTickets
      );

      console.log('Transaction submitted:', tx.hash);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction mined:', receipt);

      contract.on("EventCreated", (eventId, name, creator) => {
        alert('Event created successfully on the blockchain!');
        console.log('Event ID:', eventId.toString());
        console.log('Event Name:', name);
        console.log('Event Creator:', creator);
      });
      
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
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="description">Event Venue</label>
          <textarea
            id="venue"
            name="venue"
            value={eventData.venue}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Enter event venue"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="ticketPrice">
            Ticket Price ({currency})
          </label>
          <input
            type='number'
            name='ticketPrice'
            value={eventData.ticketPrice}
            onChange={handleChange}
            required
            step={"0.001"}
            placeholder={`Enter price in ${currency}`}
          />
          {currency !== 'AVAX' && eventData.ticketPrice && (
            <p className="text-xs text-gray-500 mt-1">
              ≈ {toAVAX(eventData.ticketPrice)} AVAX
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="totalTickets">Total Tickets</label>
          <input 
            type='number'
            name='totalTickets'
            value={eventData.totalTickets}
            onChange={handleChange}
            required
          />
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="bg-purple-500 text-white py-2 px-6 rounded-md hover:bg-purple-600 transition duration-300"
          >
            Create Event
      <section>
        <div>
          <Chatbit />
        </div>
      </section>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;