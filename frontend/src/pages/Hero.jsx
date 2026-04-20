'use client';

import { useWallet } from '../contexts/WalletContext';

export default function WalletConnection() {
  const { walletAddress, isConnecting, connectWallet, disconnectWallet } = useWallet();

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert(error.message || 'Failed to connect wallet.');
    }
  };

  return (
    <div className="flex justify-end p-4">
      <button
        onClick={walletAddress ? disconnectWallet : handleConnectWallet}
        disabled={isConnecting}
        className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm 
          hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 
          focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
      >
        {isConnecting ? 'Connecting...' : walletAddress ? `Disconnect (${walletAddress.slice(0, 6)}...)` : 'Connect Wallet'}
      </button>
    </div>
  );
}
