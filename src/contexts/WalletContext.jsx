import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkId, setNetworkId] = useState(null);

  const EXPECTED_CHAIN_ID = 43113; // Avalanche Fuji Testnet

  const switchToAvalanche = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xA869' }], // 43113 in hex
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xA869',
              chainName: 'Avalanche Fuji C-Chain',
              nativeCurrency: {
                name: 'Avalanche',
                symbol: 'AVAX',
                decimals: 18
              },
              rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
              blockExplorerUrls: ['https://testnet.snowtrace.io/']
            }]
          });
        } catch (addError) {
          throw new Error('Failed to add Avalanche Fuji network');
        }
      } else {
        throw switchError;
      }
    }
  };

  // Check wallet connection on mount
  useEffect(() => {
    checkWalletConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          // Also get network info
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          setNetworkId(Number(network.chainId));
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
    } else {
      setWalletAddress(null);
      setNetworkId(null);
    }
  };

  const handleChainChanged = async (chainId) => {
    const numericChainId = parseInt(chainId, 16);
    setNetworkId(numericChainId);
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setNetworkId(null);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      throw new Error("Please install MetaMask to connect your wallet!");
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();

        setWalletAddress(address);
        setNetworkId(Number(network.chainId));

        return address;
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setNetworkId(null);
  };

  const isConnected = !!walletAddress;

  const validateNetwork = async () => {
    if (!window.ethereum) {
      throw new Error('No wallet detected');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const currentChainId = Number(network.chainId);

    if (currentChainId !== EXPECTED_CHAIN_ID) {
      alert(`⚠️ Wrong Network!\n\nPlease switch to Avalanche Fuji Testnet.\n\nCurrent: Chain ID ${currentChainId}\nRequired: Chain ID ${EXPECTED_CHAIN_ID}`);
      await switchToAvalanche();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const value = {
    walletAddress,
    isConnecting,
    networkId,
    connectWallet,
    disconnectWallet,
    switchToAvalanche,
    isConnected,
    EXPECTED_CHAIN_ID,
    validateNetwork
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};