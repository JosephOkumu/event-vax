"use client"

import React, { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Wallet, Loader2, AlertCircle, Tag, ShoppingCart } from "lucide-react"
import { useWallet } from '../contexts/WalletContext'

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (request: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (...args: any[]) => void) => void
      removeListener: (event: string, callback: (...args: any[]) => void) => void
    }
  }
}

interface Ticket {
  tokenId: string
  owner: string
  isForSale: boolean
  price: bigint
}

interface ResaleListing {
  tokenId: string
  owner: string
  isForSale: boolean
  price: bigint
}

const CONTRACT_ADDRESS = "0x256ff3b9d3df415a05ba42beb5f186c28e103b2a"
const CONTRACT_ABI = [
  "function balanceOf(address owner) public view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)",
  "function listTicketForSale(uint256 tokenId, uint256 price) public",
  "function buyResaleTicket(uint256 tokenId) public payable",
  "function cancelResaleListing(uint256 tokenId) public",
  "function getTicketDetails(uint256 tokenId) public view returns (address owner, bool isForSale, uint256 price)",
]

const QuantumTicketResale = () => {
  const { walletAddress, isConnecting, connectWallet, disconnectWallet, isConnected, validateNetwork } = useWallet()
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userTickets, setUserTickets] = useState<Ticket[]>([])
  const [resaleListings, setResaleListings] = useState<ResaleListing[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [resalePrice, setResalePrice] = useState("")
  const [activeTab, setActiveTab] = useState("resell")

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    if (isConnected && walletAddress) {
      updateUserTickets()
      updateResaleListings()
    }
  }, [isConnected, walletAddress])

  const handleConnectWallet = async () => {
    try {
      setError(null)
      await connectWallet()
    } catch (error) {
      console.error("Error connecting wallet:", error)
      setError((error as Error).message || "Failed to connect wallet. Please try again.")
    }
  }

  const updateUserTickets = async () => {
    if (!isConnected || !walletAddress) return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

      const balance = await contract.balanceOf(walletAddress)
      const tickets: Ticket[] = []

      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i)
        const details = await contract.getTicketDetails(tokenId)
        tickets.push({
          tokenId: tokenId.toString(),
          owner: details.owner,
          isForSale: details.isForSale,
          price: details.price,
        })
      }

      setUserTickets(tickets)
    } catch (error) {
      console.error("Error fetching user tickets:", error)
    }
  }

  const updateResaleListings = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

      const totalSupply = await contract.totalSupply()
      const listings: ResaleListing[] = []

      for (let i = 0; i < totalSupply; i++) {
        const details = await contract.getTicketDetails(i)
        if (details.isForSale) {
          listings.push({
            tokenId: i.toString(),
            owner: details.owner,
            isForSale: details.isForSale,
            price: details.price,
          })
        }
      }

      // If no listings found from blockchain, add dummy listings
      if (listings.length === 0) {
        const dummyListings = [
          {
            tokenId: "42",
            owner: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
            isForSale: true,
            price: ethers.parseEther("0.5"),
          },
          {
            tokenId: "137",
            owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            isForSale: true,
            price: ethers.parseEther("0.75"),
          },
          {
            tokenId: "256",
            owner: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            isForSale: true,
            price: ethers.parseEther("1.2"),
          },
          {
            tokenId: "512",
            owner: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            isForSale: true,
            price: ethers.parseEther("0.9"),
          },
        ]
        setResaleListings(dummyListings)
      } else {
        setResaleListings(listings)
      }
    } catch (error) {
      console.error("Error fetching resale listings:", error)
      // Add dummy listings in case of error
      const dummyListings = [
        {
          tokenId: "42",
          owner: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
          isForSale: true,
          price: ethers.parseEther("0.5"),
        },
        {
          tokenId: "137",
          owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          isForSale: true,
          price: ethers.parseEther("0.75"),
        },
        {
          tokenId: "256",
          owner: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
          isForSale: true,
          price: ethers.parseEther("1.2"),
        },
        {
          tokenId: "512",
          owner: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
          isForSale: true,
          price: ethers.parseEther("0.9"),
        },
      ]
      setResaleListings(dummyListings)
    }
  }

  const handleListForResale = async () => {
    if (!selectedTicket || !resalePrice) return

    try {
      setIsLoading(true)
      setError(null)

      await validateNetwork()

      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const priceInWei = ethers.parseEther(resalePrice)
      const tx = await contract.listTicketForSale(selectedTicket.tokenId, priceInWei)
      await tx.wait()

      await updateUserTickets()
      await updateResaleListings()

      alert("Ticket listed for resale successfully!")
    } catch (error) {
      console.error("Error listing ticket for resale:", error)
      setError((error as Error).message || "Failed to list ticket for resale. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyResaleTicket = async (tokenId: string, price: bigint) => {
    try {
      setIsLoading(true)
      setError(null)

      await validateNetwork()

      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const tx = await contract.buyResaleTicket(tokenId, { 
        value: price,
        maxFeePerGas: ethers.parseUnits('25', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
      })
      await tx.wait()

      await updateUserTickets()
      await updateResaleListings()

      alert("Resale ticket purchased successfully!")
    } catch (error) {
      console.error("Error buying resale ticket:", error)
      setError((error as Error).message || "Failed to buy resale ticket. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 300}px`,
              height: `${Math.random() * 300}px`,
              background: "radial-gradient(circle, rgba(147,51,234,0.3) 0%, rgba(0,0,0,0) 70%)",
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <main className="relative pt-10 sm:pt-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div
            className={`text-center mb-16 transition-all duration-1000 
              ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"}`}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Quantum Realm of Ticket Collection
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto px-4 sm:px-0">
              Enter the quantum realm with an exclusive ticket to our unique experience. Each ticket grants you access
              to a one-of-a-kind event, digitally stored and verified on the blockchain.
            </p>
          </div>

          <div className="flex justify-center mb-8 flex-wrap">
            <div className="inline-flex rounded-md shadow-sm flex-wrap justify-center" role="group">
              <button
                type="button"
                onClick={() => setActiveTab("resell")}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  activeTab === "resell"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                Resell Your Ticket
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("buy")}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  activeTab === "buy"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                Buy Resale Ticket
              </button>
            </div>
          </div>

          {activeTab === "resell" && (
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-8 mb-6 md:mb-8">
              <h2 className="text-2xl font-bold mb-4">Resell Your Ticket</h2>
              <p className="text-gray-400 mb-6">List your ticket for resale on the marketplace</p>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userTickets.map((ticket) => (
                    <button
                      key={ticket.tokenId}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`px-4 py-2 rounded-lg ${
                        selectedTicket?.tokenId === ticket.tokenId
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      Ticket #{ticket.tokenId}
                    </button>
                  ))}
                </div>
                {selectedTicket && (
                  <div className="grid gap-2">
                    <label htmlFor="resalePrice" className="text-sm text-gray-400">
                      Resale Price (AVAX)
                    </label>
                    <input
                      id="resalePrice"
                      type="number"
                      placeholder="Enter resale price"
                      value={resalePrice}
                      onChange={(e) => setResalePrice(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleListForResale}
                disabled={!selectedTicket || !resalePrice || isLoading}
                className={`mt-6 w-full px-6 py-3 rounded-xl ${
                  !selectedTicket || !resalePrice || isLoading
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                } transition-colors duration-300`}
              >
                {isLoading ? (
                  <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Tag className="inline-block w-5 h-5 mr-2" />
                )}
                List for Resale
              </button>
            </div>
          )}

          {activeTab === "buy" && (
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-8 mb-6 md:mb-8">
              <h2 className="text-2xl font-bold mb-4">Buy Resale Tickets</h2>
              <p className="text-gray-400 mb-6">Purchase tickets listed for resale by other users</p>
              <div className="grid gap-4">
                {resaleListings.length > 0 ? (
                  resaleListings.map((listing) => {
                    // Generate random event details for dummy tickets
                    const eventNames = [
                      "Quantum Nexus Festival",
                      "Blockchain Summit 2023",
                      "Crypto Conference",
                      "Web3 Hackathon",
                      "NFT Art Exhibition"
                    ];
                    const locations = [
                      "Virtual Reality Hall",
                      "Metaverse Arena",
                      "Crypto Convention Center",
                      "Blockchain Boulevard",
                      "Digital Domain Stadium"
                    ];
                    const dates = [
                      "Dec 15, 2023",
                      "Jan 20, 2024",
                      "Feb 5, 2024",
                      "Mar 12, 2024",
                      "Apr 8, 2024"
                    ];
                    
                    // Use token ID to deterministically select event details
                    const tokenIdNum = parseInt(listing.tokenId);
                    const eventName = eventNames[tokenIdNum % eventNames.length];
                    const location = locations[tokenIdNum % locations.length];
                    const date = dates[tokenIdNum % dates.length];
                    
                    return (
                      <div
                        key={listing.tokenId}
                        className="flex flex-col p-4 border border-purple-500/30 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-all duration-300 backdrop-blur-sm"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                              {eventName}
                            </h3>
                            <p className="text-sm text-gray-300">Ticket #{listing.tokenId}</p>
                          </div>
                          <div className="px-3 py-1 bg-purple-600/30 rounded-full text-purple-300 text-sm font-medium">
                            {ethers.formatEther(listing.price)} AVAX
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-center text-sm text-gray-400 mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {location}
                          </div>
                          <div className="flex items-center text-sm text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {date}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-700">
                          <div className="text-xs text-gray-500">
                            Seller: {formatAddress(listing.owner)}
                          </div>
                          <button
                            onClick={() => handleBuyResaleTicket(listing.tokenId, listing.price)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-colors duration-300 flex items-center"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Buy Now
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10">
                    <div className="text-gray-400 mb-2">No tickets available for resale at the moment</div>
                    <p className="text-sm text-gray-500">Check back later or list your own ticket for resale</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 text-red-500 text-center">
              <AlertCircle className="w-6 h-6 inline-block mr-2" />
              <span className="align-middle">{error}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default QuantumTicketResale


