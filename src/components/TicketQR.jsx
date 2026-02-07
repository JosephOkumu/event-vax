import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { ethers } from 'ethers';
import { Loader, AlertCircle } from 'lucide-react';
import { CONTRACTS } from '../config/contracts';
import { QRVerificationABI } from '../abi';

const TicketQR = ({ ticket }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ticket) generateQR();
  }, [ticket]);

  const generateQR = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) throw new Error('Wallet not connected');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const attendee = await signer.getAddress();

      const contract = new ethers.Contract(
        CONTRACTS.QR_VERIFICATION,
        QRVerificationABI.abi,
        signer
      );

      const nonce = await contract.getCurrentNonce(attendee);
      const timestamp = Math.floor(Date.now() / 1000);
      const deadline = timestamp + 86400; // 24h validity

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
        nonce: (Number(nonce) + 1).toString(),
        timestamp,
        deadline
      };

      const signature = await signer.signTypedData(domain, types, value);

      setQrData(JSON.stringify({ ...value, signature }));
      setLoading(false);
    } catch (err) {
      console.error('QR generation failed:', err);
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
        <p className="text-sm text-red-400">{error}</p>
        <button 
          onClick={generateQR}
          className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm"
        >
          Retry
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
