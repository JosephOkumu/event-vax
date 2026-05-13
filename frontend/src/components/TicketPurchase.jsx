import React, { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from '../contexts/WalletContext';
import { MarketplaceABI } from '../abi';
import { CONTRACTS } from '../config/contracts';

export default function TicketPurchase() {
  const { walletAddress, isConnecting, connectWallet, isConnected } = useWallet();
  const [quantity, setQuantity] = useState(1);
  const [pricePerTicket, setPricePerTicket] = useState(1);
  const [error, setError] = useState("");

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setError("");
    } catch (err) {
      setError(err.message || "Failed to connect wallet");
    }
  };

  // Handle ticket quantity change
  const handleQuantityChange = (event) => {
    setQuantity(Number(event.target.value));
  };

  const handlePurchase = async () => {
    if (!isConnected) {
      setError("Please connect your wallet before purchasing.");
      return;
    }

    const totalCost = ethers.parseEther((quantity * pricePerTicket).toString());

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: CONTRACTS.MARKETPLACE,
        value: totalCost,
        maxFeePerGas: ethers.parseUnits('25', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
      });

      await tx.wait(); // Wait for the transaction to be mined
      alert(`Successfully purchased ${quantity} tickets! Transaction Hash: ${tx.hash}`);
      setError("");
    } catch (err) {
      setError("Transaction failed: " + err.message);
    }
  };

  return (
    <div className="ticket-purchase">
      <h1>Ticket Purchase</h1>

      {!isConnected ? (
        <button onClick={handleConnectWallet} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      ) : (
        <p>Connected Wallet: {walletAddress}</p>
      )}

      <label>
        Quantity:
        <input
          type="number"
          value={quantity}
          onChange={handleQuantityChange}
          min="1"
        />
      </label>

      <p>Price per Ticket: {pricePerTicket} AVAX</p>
      <p>Total Cost: {quantity * pricePerTicket} AVAX</p>

      <button onClick={handlePurchase}>Complete Purchase</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}



/***import React, { useState } from "react";

export default function TicketPurchase() {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (event) => {
    setQuantity(event.target.value);
  };

  const handlePurchase = () => {
    alert(`Purchasing ${quantity} tickets`);
  };

  return (
    <div className="ticket-purchase">
      <h1>Ticket Purchase</h1>
      <label>
        Quantity:
        <input type="number" value={quantity} onChange={handleQuantityChange} min="1" />
      </label>
      <button onClick={handlePurchase}>Complete Purchase</button>
    </div>
  );
} ***/

