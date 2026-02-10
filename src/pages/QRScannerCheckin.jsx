import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ethers } from 'ethers';
import { CheckCircle, XCircle, Loader, Scan, Award } from 'lucide-react';
import { QRVerificationABI } from '../abi';
import { CONTRACTS } from '../config/contracts';
import { useWallet } from '../contexts/WalletContext';
import { useSearchParams } from 'react-router-dom';

const QRScannerCheckin = () => {
  const { validateNetwork } = useWallet();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [attendeeInfo, setAttendeeInfo] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const onScanSuccess = async (decodedText) => {
      try {
        scannerRef.current?.pause?.();
      } catch (e) {
        console.log('Scanner pause skipped');
      }
      
      setStatus('verifying');
      setMessage('Verifying ticket...');
      setAttendeeInfo(null);

      try {
        const qrData = JSON.parse(decodedText);
        
        if (eventId && qrData.eventId !== parseInt(eventId)) {
          throw new Error('Wrong event ticket');
        }
        
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

        const tx = await contract.verifyAndCheckIn(
          qrData.eventId,
          qrData.attendee,
          qrData.tierId,
          qrData.nonce,
          qrData.timestamp,
          qrData.deadline,
          qrData.signature
        );

        await tx.wait();

        setStatus('success');
        setMessage('✓ Check-in Successful');
        setAttendeeInfo({
          address: `${qrData.attendee.slice(0, 6)}...${qrData.attendee.slice(-4)}`,
          tier: ['Regular', 'VIP', 'VVIP'][qrData.tierId] || 'General',
          poapAwarded: true
        });
        
        setTimeout(() => {
          setStatus('idle');
          setAttendeeInfo(null);
          try {
            scannerRef.current?.resume?.();
          } catch (e) {
            console.log('Scanner resume skipped');
          }
        }, 3000);

      } catch (error) {
        setStatus('error');
        setMessage(getErrorMessage(error));
        
        setTimeout(() => {
          setStatus('idle');
          try {
            scannerRef.current?.resume?.();
          } catch (e) {
            console.log('Scanner resume skipped');
          }
        }, 3000);
      }
    };

    qrScanner.render(onScanSuccess);
    scannerRef.current = qrScanner;

    return () => qrScanner.clear().catch(() => {});
  }, [eventId, validateNetwork]);

  const getErrorMessage = (error) => {
    const msg = error.message || error.toString();
    if (msg.includes('Wrong event')) return '✗ Wrong Event Ticket';
    if (msg.includes('AlreadyCheckedIn')) return '✗ Already Checked In';
    if (msg.includes('NoTicketOwned')) return '✗ Invalid Ticket';
    if (msg.includes('DeadlineExpired')) return '✗ Ticket Expired';
    if (msg.includes('EventNotStarted')) return '✗ Event Not Started';
    if (msg.includes('EventEnded')) return '✗ Event Ended';
    if (msg.includes('user rejected')) return '✗ Transaction Rejected';
    return '✗ Verification Failed';
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Event Check-in Scanner
          </h1>
          <p className="text-gray-400">Scan ticket for check-in + POAP</p>
          {eventId && (
            <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-xs text-purple-300">Event ID: {eventId}</p>
            </div>
          )}
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
            {attendeeInfo && (
              <div className="text-sm space-y-2">
                <p className="text-gray-300">Attendee: {attendeeInfo.address}</p>
                <p className="text-purple-400 font-semibold">{attendeeInfo.tier} Ticket</p>
                {attendeeInfo.poapAwarded && (
                  <div className="flex items-center justify-center space-x-2 text-yellow-400">
                    <Award className="w-4 h-4" />
                    <span>POAP Awarded</span>
                  </div>
                )}
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

export default QRScannerCheckin;
