import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { ethers } from 'ethers';
import Chatbit from './Chatbit';
import { Shield, CheckCircle, XCircle, RefreshCw, Ticket, Lock, Scan, Globe, AlertTriangle } from 'lucide-react';
import { QRVerificationABI } from '../abi';
import { CONTRACTS, NETWORK } from '../config/contracts';


const QRVerificationSystem = () => {
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

  // Mock Ticket Data
  const mockTickets = [
    {
      id: 'AVBX2-1234',
      event: 'Blockchain Summit 2025',
      date: '2025-03-15',
      venue: 'Tech Center',
      price: '0.5 AVAX',
      txHash: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
    },
    {
      id: 'AVBX2-5678',
      event: 'Web3 Conference',
      date: '2025-04-01',
      venue: 'Innovation Hub',
      price: '0.8 AVAX',
      txHash: '0x912d35Cc6634C0532925a3b844Bc454e4438f123'
    }
  ];

  // Network Switching Utility
  const switchToAvalancheNetwork = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const avalancheChainId = `0x${NETWORK.CHAIN_ID.toString(16)}`;
    const avalancheParams = {
      chainId: avalancheChainId,
      chainName: NETWORK.NAME,
      nativeCurrency: {
        name: 'AVAX',
        symbol: 'AVAX',
        decimals: 18
      },
      rpcUrls: [NETWORK.RPC_URL],
      blockExplorerUrls: [NETWORK.EXPLORER]
    };

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: avalancheChainId }]
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [avalancheParams]
          });
        } catch (addError) {
          console.error('Error adding Avalanche network', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  };

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
          console.error('Connection check error:', err);
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
      
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      await switchToAvalancheNetwork();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(NETWORK.CHAIN_ID)) {
        throw new Error('Not connected to Avalanche C-Chain');
      }

      const ticketContract = new ethers.Contract(
        CONTRACTS.QR_VERIFICATION,
        QRVerificationABI.abi,
        signer
      );

      setProvider(provider);
      setContract(ticketContract);
      setConnected(true);
      setError(null);
    } catch (err) {
      console.error('Contract initialization error:', err);
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
      await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      await initializeContract();
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  // QR Code Generation
  const generateQRCode = (ticketData) => {
    setSelectedTicket(ticketData);
    const qrString = JSON.stringify({
      ticketId: ticketData.id,
      txHash: ticketData.txHash,
      timestamp: Date.now()
    });
    setQrData(qrString);
  };

  // Ticket Verification
  const verifyTicketOnBlockchain = async () => {
    if (!selectedTicket) {
      setError('Please select a ticket to verify');
      return;
    }

    if (!connected || !contract) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      await switchToAvalancheNetwork();

      const tx = await contract.verifyTicket(selectedTicket.id);
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        setVerificationStatus('success');
      } else {
        setVerificationStatus('error ');
        throw new Error('Transaction failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      if (err.code === 4001) {
        // User rejected the transaction, reset the verification status without showing an error
        setVerificationStatus(null);
      } else if (err.code === -32602) {
        setError('Invalid request. Please check your MetaMask connection.');
        setVerificationStatus('error');
      } else {
        setError(err.message || 'Verification failed');
        setVerificationStatus('error');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto relative">
        {/* Connection Status */}
        <div className="mb-4 text-center">
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
          {/* Ticket Selection */}
          <div className="space-y-6">
            <div className="bg-purple-900/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Ticket className="w-5 h-5 mr-2 text-purple-400" />
                Select Ticket to Verify
              </h2>
              
              <div className="space-y-4">
                {mockTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => generateQRCode(ticket)}
                    className={`group relative p-4 rounded-lg border border-purple-500/20 cursor-pointer 
                      transition-all duration-300 hover:border-purple-500/40 
                      ${selectedTicket?.id === ticket.id ? 'bg-purple-900/40' : 'bg-purple-900/20'}`}
                  >
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-purple-300">{ticket.event}</h3>
                        <span className="text-sm text-gray-400">{ticket.id}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                        <div>Date: {ticket.date}</div>
                        <div>Venue: {ticket.venue}</div>
                        <div>Price: {ticket.price}</div>
                        <div className="truncate">Tx: {ticket.txHash}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QR Code and Verification */}
          <div className="space-y-6">
            <div className="bg-purple-900/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Scan className="w-5 h-5 mr-2 text-purple-400" />
                Ticket QR Code
              </h2>
              
              <div className="flex justify-center p-8">
                {qrData ? (
                  <div className="bg-white p-4 rounded-xl">
                    <QRCode value={qrData} size={200} />
                  </div>
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

                {qrData && !isVerifying && (
                  <button
                    onClick={verifyTicketOnBlockchain}
                    disabled={!connected}
                    className={`mt-6 px-8 py-3 rounded-lg flex items-center justify-center space-x-2 mx-auto
                      ${connected 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 cursor-pointer'
                        : 'bg-gray-600 cursor-not-allowed'}`}
                  >
                    <Shield className="w-5 h-5" />
                    <span>Verify on Avalanche</span>
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

