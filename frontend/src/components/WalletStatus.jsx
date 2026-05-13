import React from 'react';
import { useWallet } from '../contexts/WalletContext';

const WalletStatus = () => {
  const { walletAddress, isConnected, isConnecting, networkId, EXPECTED_CHAIN_ID } = useWallet();

  if (!isConnected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-purple-500/30 rounded-lg p-3 text-xs text-white z-50">
      <div className="flex items-center space-x-2 mb-1">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span>Wallet Connected</span>
      </div>
      <div className="text-gray-300">
        <div>Address: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</div>
        <div>Network: {networkId === EXPECTED_CHAIN_ID ? 'Avalanche' : `Chain ${networkId}`}</div>
      </div>
    </div>
  );
};

export default WalletStatus;