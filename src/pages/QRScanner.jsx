import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ethers } from 'ethers';
import { CheckCircle, XCircle, Loader, Scan, Info } from 'lucide-react';
import { QRVerificationABI } from '../abi';
import { CONTRACTS } from '../config/contracts';
import { useWallet } from '../contexts/WalletContext';

const QRScanner = () => {
  const { validateNetwork } = useWallet();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [scanner, setScanner] = useState(null);
  const [ticketInfo, setTicketInfo] = useState(null);

  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    qrScanner.render(onScanSuccess);
    setScanner(qrScanner);

    return () => qrScanner.clear().catch(() => {});
  }, []);

  const onScanSuccess = async (decodedText) => {
    scanner.pause();
    setStatus('verifying');
    setMessage('Verifying ticket...');
    setTicketInfo(null);

    try {
      const qrData = JSON.parse(decodedText);
      
      if (!window.ethereum) throw new Error('Wallet not found');
      
      await validateNetwork();
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(
        CONTRACTS.QR_VERIFICATION,
        QRVerificationABI.abi,
        signer
      );

      // Verify signature only (no check-in)
      const [valid, reason] = await contract.verifyQRSignature(
        qrData.eventId,
        qrData.attendee,
        qrData.tierId,
        qrData.nonce,
        qrData.timestamp,
        qrData.deadline,
        qrData.signature
      );

      if (!valid) throw new Error(reason);

      setStatus('success');
      setMessage('✓ Ticket Valid');
      setTicketInfo({
        address: `${qrData.attendee.slice(0, 6)}...${qrData.attendee.slice(-4)}`,
        tier: ['Regular', 'VIP', 'VVIP'][qrData.tierId] || 'General',
        eventId: qrData.eventId
      });
      
      setTimeout(() => {
        setStatus('idle');
        setTicketInfo(null);
        scanner.resume();
      }, 3000);

    } catch (error) {
      setStatus('error');
      setMessage(getErrorMessage(error));
      
      setTimeout(() => {
        setStatus('idle');
        scanner.resume();
      }, 3000);
    }
  };

  const getErrorMessage = (error) => {
    const msg = error.message || error.toString();
    if (msg.includes('Nonce already used')) return '✗ Ticket Already Used';
    if (msg.includes('QR already used')) return '✗ QR Code Already Scanned';
    if (msg.includes('Deadline expired')) return '✗ Ticket Expired';
    if (msg.includes('Invalid signature')) return '✗ Invalid Ticket';
    if (msg.includes('user rejected')) return '✗ Transaction Rejected';
    return '✗ Verification Failed';
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Universal Ticket Verifier
          </h1>
          <p className="text-gray-400">Verify ticket authenticity (no check-in)</p>
          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-300 text-left">
                This scanner only verifies tickets. For event check-in with POAP minting, use the scanner in Event Dashboard.
              </p>
            </div>
          </div>
        </div>

        <div id="qr-reader" className="rounded-xl overflow-hidden mb-6 border-2 border-purple-500/30" />
        
        {status === 'idle' && (
          <div className="text-center p-6 bg-gray-900/50 rounded-xl border border-purple-500/30">
            <Scan className="w-12 h-12 mx-auto mb-2 text-purple-400 animate-pulse" />
            <p className="text-gray-400">Ready to scan</p>
          </div>
        )}

        {status === 'verifying' && (
          <div className="p-6 rounded-xl text-center bg-purple-500/20 border-2 border-purple-500">
            <Loader className="w-12 h-12 mx-auto mb-2 animate-spin text-purple-400" />
            <p className="text-xl font-bold">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="p-6 rounded-xl text-center bg-green-500/20 border-2 border-green-500">
            <CheckCircle className="w-16 h-16 mx-auto mb-3 text-green-400" />
            <p className="text-2xl font-bold mb-3">{message}</p>
            {ticketInfo && (
              <div className="text-sm space-y-1">
                <p className="text-gray-300">Owner: {ticketInfo.address}</p>
                <p className="text-purple-400 font-semibold">{ticketInfo.tier} Ticket</p>
                <p className="text-gray-400">Event ID: {ticketInfo.eventId}</p>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="p-6 rounded-xl text-center bg-red-500/20 border-2 border-red-500">
            <XCircle className="w-16 h-16 mx-auto mb-3 text-red-400" />
            <p className="text-2xl font-bold">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
