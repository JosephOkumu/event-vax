import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { ethers } from 'ethers';
import { Loader, AlertCircle } from 'lucide-react';
import { CONTRACTS } from '../config/contracts';
import { QRVerificationABI } from '../abi';

const TicketQR = ({ ticket }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);



  const generateQR = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔵 [DEBUG] Generating QR for ticket:', ticket);

      if (!window.ethereum) throw new Error('Wallet not connected');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const attendee = await signer.getAddress();
      console.log('🔵 [DEBUG] Attendee:', attendee);

      const contract = new ethers.Contract(
        CONTRACTS.QR_VERIFICATION,
        QRVerificationABI.abi,
        signer
      );

      const currentNonce = await contract.getCurrentNonce(attendee);
      const nonce = Number(currentNonce) + 1;
      const timestamp = Math.floor(Date.now() / 1000);
      const deadline = timestamp + 86400; // 24h validity

      console.log('🔵 [DEBUG] QR params:', {
        eventId: ticket.eventId,
        attendee,
        tierId: ticket.tierId || 0,
        nonce,
        timestamp,
        deadline
      });

      const domain = {
        name: 'QRVerificationSystem',
        version: '1',
        chainId: 43113,
        verifyingContract: CONTRACTS.QR_VERIFICATION
      };

      const types = {
        QRVerify: [
          { name: 'eventId', type: 'uint256' },
          { name: 'attendee', type: 'address' },
          { name: 'tierId', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      };

      const value = {
        eventId: ticket.eventId,
        attendee,
        tierId: ticket.tierId || 0,
        nonce,
        timestamp,
        deadline
      };

      console.log('🔵 [DEBUG] Requesting signature...');
      const signature = await signer.signTypedData(domain, types, value);
      console.log('✅ [DEBUG] Signature generated:', signature);

      const qrPayload = JSON.stringify({ ...value, signature });
      console.log('✅ [DEBUG] QR payload:', qrPayload);
      
      setQrData(qrPayload);
      setLoading(false);
    } catch (err) {
      console.error('🔴 [DEBUG] QR generation failed:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 p-6 rounded-xl text-center">
        <Loader className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-400" />
        <p className="text-sm text-gray-400">Generating QR...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 p-6 rounded-xl text-center border border-red-500/30">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
        <p className="text-sm text-red-400 mb-2">
          {error.includes('rejected') || error.includes('denied') 
            ? 'Signature rejected. Please approve the wallet request to generate your QR code.'
            : error}
        </p>
        <button 
          onClick={generateQR}
          className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!qrData) {
    return (
      <div className="bg-gray-800/50 p-6 rounded-xl text-center">
        <p className="text-sm text-gray-400 mb-3">Generate your ticket QR code for entry</p>
        <button 
          onClick={generateQR}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
        >
          Generate QR Code
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl inline-block">
      <QRCode value={qrData} size={200} level="H" />
      <p className="text-xs text-gray-500 mt-2 text-center">Valid for 24 hours</p>
    </div>
  );
};

export default TicketQR;
