import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, RefreshCw, Ticket, Lock, Scan, Globe, AlertTriangle } from 'lucide-react';
import { ethers } from 'ethers';
import Chatbit from './Chatbit';
import TicketQR from '../components/TicketQR';
import { QRVerificationABI, POAPABI } from '../abi';
import { CONTRACTS, NETWORK } from '../config/contracts';
import { useWallet } from '../contexts/WalletContext';
import { API_BASE_URL } from '../config/api';


const QRVerificationSystem = () => {
  const { validateNetwork, switchToAvalanche } = useWallet();
  // State Management
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [qrData, setQrData] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize Connection and Event Listeners
  useEffect(() => {
    let mounted = true;

    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts && accounts.length > 0 && mounted) {
            await initializeContract();
          }
        } catch (err) {
          console.error('🔴 [DEBUG] Connection check error:', err);
        }
      }
    };

    checkConnection();

    return () => {
      mounted = false;
    };
  }, []);

  // Metamask Event Listeners
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = () => window.location.reload();

      const handleAccountsChanged = async (accounts) => {
        console.log('🔵 [DEBUG] Accounts changed:', accounts);
        if (accounts.length === 0) {
          setConnected(false);
          setContract(null);
          setProvider(null);
        } else {
          await initializeContract();
        }
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  // Contract Initialization
  const initializeContract = async () => {
    if (isInitializing) return;
    
    try {
      setIsInitializing(true);
      console.log('🔵 [DEBUG] Initializing contract...');
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      await validateNetwork();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log('🔵 [DEBUG] Signer address:', signerAddress);
      
      const network = await provider.getNetwork();
      console.log('🔵 [DEBUG] Network:', { chainId: network.chainId.toString(), name: network.name });
      
      if (network.chainId !== BigInt(NETWORK.CHAIN_ID)) {
        throw new Error('Not connected to Avalanche C-Chain');
      }

      const ticketContract = new ethers.Contract(
        CONTRACTS.QR_VERIFICATION,
        QRVerificationABI.abi,
        signer
      );
      
      console.log('✅ [DEBUG] Contract initialized:', CONTRACTS.QR_VERIFICATION);

      setProvider(provider);
      setContract(ticketContract);
      setConnected(true);
      setError(null);
    } catch (err) {
      console.error('🔴 [DEBUG] Contract initialization error:', err);
      setError(err.message);
      setConnected(false);
    } finally {
      setIsInitializing(false);
    }
  };

  // Wallet Connection
  const connectWallet = async () => {
    if (isInitializing) return;
    
    try {
      setIsInitializing(true);
      console.log('🔵 [DEBUG] Connecting wallet...');
      await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      await initializeContract();
    } catch (err) {
      console.error('🔴 [DEBUG] Wallet connection error:', err);
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  // QR Code Generation
  const generateQRCode = (ticketData) => {
    console.log('🔵 [DEBUG] Selected ticket:', ticketData);
    setSelectedTicket(ticketData);
  };

  // Ticket Verification with POAP Minting
  const verifyTicketOnBlockchain = async () => {
    if (!selectedTicket) {
      console.error('🔴 [DEBUG] No ticket selected');
      setError('Please select a ticket to verify');
      return;
    }

    if (!connected || !contract) {
      console.error('🔴 [DEBUG] Wallet not connected');
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      console.log('🔵 [DEBUG] Starting verification for ticket:', selectedTicket);

      await validateNetwork();

      const signer = await provider.getSigner();
      const attendee = await signer.getAddress();
      console.log('🔵 [DEBUG] Attendee address:', attendee);

      // Get current nonce
      const currentNonce = await contract.getCurrentNonce(attendee);
      const nonce = Number(currentNonce) + 1;
      const timestamp = Math.floor(Date.now() / 1000);
      const deadline = timestamp + 86400;

      console.log('🔵 [DEBUG] Verification params:', {
        eventId: selectedTicket.eventId,
        attendee,
        tierId: selectedTicket.tierId,
        nonce,
        timestamp,
        deadline
      });

      // Generate EIP-712 signature
      const domain = {
        name: 'QRVerificationSystem',
        version: '1',
        chainId: NETWORK.CHAIN_ID,
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
        eventId: selectedTicket.eventId,
        attendee,
        tierId: selectedTicket.tierId,
        nonce,
        timestamp,
        deadline
      };

      console.log('🔵 [DEBUG] Signing typed data...');
      const signature = await signer.signTypedData(domain, types, value);
      console.log('✅ [DEBUG] Signature generated:', signature);

      console.log('🔵 [DEBUG] Calling verifyAndCheckIn...');
      const tx = await contract.verifyAndCheckIn(
        selectedTicket.eventId,
        attendee,
        selectedTicket.tierId,
        nonce,
        timestamp,
        deadline,
        signature
      );
      
      console.log('🔵 [DEBUG] Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ [DEBUG] Transaction confirmed:', receipt);
      
      if (receipt.status === 1) {
        console.log('✅ [DEBUG] Verification successful!');
        setVerificationStatus('success');
        
        // Auto-mint POAP after successful check-in
        await mintPoapOnCheckIn(selectedTicket.id);
      } else {
        console.error('🔴 [DEBUG] Transaction failed');
        setVerificationStatus('error ');
        throw new Error('Transaction failed');
      }
    } catch (err) {
      console.error('🔴 [DEBUG] Verification error:', {
        message: err.message,
        code: err.code,
        data: err.data,
        reason: err.reason
      });
      
      if (err.code === 4001) {
        console.log('🔴 [DEBUG] User rejected transaction');
        setVerificationStatus(null);
      } else if (err.code === -32602) {
        setError('Invalid request. Please check your MetaMask connection.');
        setVerificationStatus('error');
      } else if (err.message?.includes('AlreadyCheckedIn')) {
        setError('Ticket already checked in');
        setVerificationStatus('error');
      } else if (err.message?.includes('NoTicketOwned')) {
        setError('You do not own this ticket');
        setVerificationStatus('error');
      } else if (err.message?.includes('InvalidSignature')) {
        setError('Invalid signature - QR code may be corrupted');
        setVerificationStatus('error');
      } else {
        setError(err.reason || err.message || 'Verification failed');
        setVerificationStatus('error');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Mint POAP on Check-in
  const mintPoapOnCheckIn = async (ticketId) => {
    try {
      console.log('🔵 [DEBUG] Attempting POAP mint for ticket:', ticketId);
      if (!selectedTicket) {
        console.warn('⚠️ [DEBUG] No ticket selected for POAP minting');
        return;
      }
      const signer = await provider.getSigner();
      const attendeeAddress = await signer.getAddress();
      
      // Use selectedTicket.eventId directly instead of parsing ticketId
      const eventId = selectedTicket.eventId;
      console.log('🔵 [DEBUG] Event ID:', eventId);
      
      // Get POAP data from backend
      const eventResponse = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
      if (!eventResponse.ok) throw new Error('Failed to fetch event data');
      const event = await eventResponse.json();
      
      if (!event.data?.poap_content_hash) {
        console.log('⚠️ [DEBUG] No POAP available for this event');
        return;
      }
      
      console.log('🔵 [DEBUG] Minting POAP...');
      // Mint POAP
      const poapContract = new ethers.Contract(CONTRACTS.POAP, POAPABI.abi, signer);
      const tx = await poapContract.awardPOAP(
        eventId,
        attendeeAddress,
        event.data.poap_content_hash
      );
      await tx.wait();
      
      console.log('✅ [DEBUG] POAP minted successfully!');
    } catch (error) {
      console.warn('⚠️ [DEBUG] POAP minting failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto relative">
        {/* Connection Status */}
        <div className="mb-4 text-center">
          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              {error}
            </div>
          )}
          {!connected ? (
            <button
              onClick={connectWallet}
              disabled={isInitializing}
              className={`px-4 py-2 bg-purple-600 rounded-lg transition-colors ${
                isInitializing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500'
              }`}
            >
              {isInitializing ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <span className="text-green-400 flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Wallet Connected
            </span>
          )}
        </div>


        {/* Main Content */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 
            bg-clip-text text-transparent">
            Avalanche Ticket Verification
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Secure ticket verification powered by Avalanche blockchain technology. 
            Generate and verify QR codes for your event tickets instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* QR Code and Verification */}
          <div className="space-y-6">
            <div className="bg-purple-900/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Scan className="w-5 h-5 mr-2 text-purple-400" />
                Ticket QR Code
              </h2>
              
              <div className="flex justify-center p-8">
                {selectedTicket ? (
                  <TicketQR ticket={selectedTicket} />
                ) : (
                   <div className="text-gray-400 text-center">
                    <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    Select a ticket to generate QR code
                  </div>
                )}
              </div>
            </div>

            <div className="bg-purple-900/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-purple-400" />
                Verification Status
              </h2>
              
              <div className="text-center">
                {isVerifying ? (
                  <div className="animate-pulse">
                    <RefreshCw className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-spin" />
                    <p>Verifying on Avalanche Network...</p>
                  </div>
                ) : verificationStatus === 'success' ? (
                  <div className="text-green-400">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                    <p>Ticket Verified Successfully!</p>
                  </div>
                ) : verificationStatus === 'error' ? (
                  <div className="text-red-400">
                    <XCircle className="w-16 h-16 mx-auto mb-4" />
                    <p>Verification Failed</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Ready to verify ticket</p>
                  </div>
                )}

                {selectedTicket && !isVerifying && (
                  <button
                    onClick={verifyTicketOnBlockchain}
                    disabled={!connected}
                    className={`mt-6 px-8 py-3 rounded-lg flex items-center justify-center space-x-2 mx-auto
                      ${connected 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 cursor-pointer'
                        : 'bg-gray-600 cursor-not-allowed'}`}
                  >
                    <Shield className="w-5 h-5" />
                    <span>Manual Verify (Testing)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <section>
          <div>
            <Chatbit />
          </div>
        </section>
      </div>
    </div>
  );
};

export default QRVerificationSystem;

