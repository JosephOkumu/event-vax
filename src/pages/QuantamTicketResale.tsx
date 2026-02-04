"use client"

import React, { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Wallet, Loader2, AlertCircle, Tag, ShoppingCart, Search, Filter, Eye, X, Calendar, MapPin, Ticket as TicketIcon } from "lucide-react"
import { useWallet } from '../contexts/WalletContext'
import EventverseTicket from '../components/EventverseTicket'

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
  const { walletAddress, isConnecting, connectWallet, disconnectWallet, isConnected } = useWallet()
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userTickets, setUserTickets] = useState<Ticket[]>([])
  const [resaleListings, setResaleListings] = useState<ResaleListing[]>([])
  // 'selectedTicket' used for Resell Tab (listing item) - though with new UI we might pass directly
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  // New States for Features
  const [viewTicket, setViewTicket] = useState<ResaleListing | Ticket | null>(null) // For Modal
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest") // newest, price_asc, price_desc

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

  const handleListForResale = async (ticket: Ticket) => {
    try {
      setIsLoading(true)
      setError(null)

      // SYSTEM DETERMINED PRICE LOGIC
      // For demo purposes, we set a standard resale price or calculate based on ticket type
      // Real implementation might fetch this from an oracle or contract constant
      const SYSTEM_PRICE = "0.5"; // 0.5 AVAX fixed system price for now

      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const priceInWei = ethers.parseEther(SYSTEM_PRICE)
      const tx = await contract.listTicketForSale(ticket.tokenId, priceInWei)
      await tx.wait()

      await updateUserTickets()
      await updateResaleListings()

      alert(`Ticket #${ticket.tokenId} listed for resale at ${SYSTEM_PRICE} AVAX!`)
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
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${activeTab === "resell"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
              >
                Resell Your Ticket
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("buy")}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${activeTab === "buy"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
              >
                Buy Resale Ticket
              </button>
            </div>
          </div>

          {activeTab === "resell" && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Tag className="w-6 h-6 mr-2 text-purple-400" />
                Your Collectibles
              </h2>
              <div className="space-y-4">
                {userTickets.length > 0 ? (
                  userTickets.map((ticket) => (
                    <div
                      key={ticket.tokenId}
                      className="group bg-gray-900/50 backdrop-blur-md border border-gray-800 hover:border-purple-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-6 transition-all duration-300"
                    >
                      {/* Ticket Preview Mini */}
                      <div className="w-full sm:w-48 h-24 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/40" />
                        <span className="relative z-10 font-mono text-purple-300 font-bold text-xl">#{ticket.tokenId}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-lg font-bold text-white mb-1">Event Ticket #{ticket.tokenId}</h3>
                        <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> System Price: 0.5 AVAX</span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="w-full sm:w-auto">
                        <button
                          onClick={() => handleListForResale(ticket)}
                          disabled={isLoading}
                          className="w-full px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                          Resell Now
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800 border-dashed">
                    <Tag className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">You don't have any tickets to resell.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "buy" && (
            <div>
              {/* Search & Filter Bar */}
              <div className="flex flex-col md:flex-row gap-4 mb-8 bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by event name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 bg-black/50 border border-gray-700 rounded-xl px-4">
                  <Filter className="text-gray-400 w-5 h-5" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-white py-3 outline-none cursor-pointer"
                  >
                    <option value="newest">Newest Listed</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {resaleListings
                  .filter(item => {
                    // Mock filtering by name since blockahin data is limited in this demo context
                    // For real app, would filter by metadata
                    return true;
                  })
                  .sort((a, b) => {
                    if (sortBy === 'price_asc') return Number(a.price) - Number(b.price);
                    if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
                    return 0;
                  })
                  .map((listing) => {
                    // Generate random event details for dummy tickets
                    // ... (Keeping existing dummy data generation logic for consistency) ...
                    const eventNames = ["Quantum Nexus", "Blockchain Summit", "Crypto Conf", "Web3 Hackathon", "NFT Exhibition"];
                    const locations = ["Virtual Hall", "Metaverse", "Crypto Center", "Blockchain Blvd", "Digital Stadium"];
                    const dates = ["Dec 15", "Jan 20", "Feb 05", "Mar 12", "Apr 08"];

                    const tokenIdNum = parseInt(listing.tokenId);
                    const eventName = eventNames[tokenIdNum % eventNames.length];
                    const location = locations[tokenIdNum % locations.length];
                    const date = dates[tokenIdNum % dates.length];

                    // Construct a 'complete' ticket object for the preview modal
                    const fullTicketData = {
                      ...listing,
                      eventName,
                      eventDate: date,
                      venue: location,
                      // Add dummy image or seat if missing
                      image: `https://images.unsplash.com/photo-${1540575467063 + tokenIdNum}?w=800&h=400&fit=crop`
                    };

                    return (
                      <div
                        key={listing.tokenId}
                        className="group bg-gray-900 border border-gray-800 hover:border-purple-500/50 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-purple-900/20 transition-all duration-300 flex flex-col"
                      >
                        {/* Image Area */}
                        <div className="h-48 bg-gray-800 relative overflow-hidden">
                          <img
                            src={fullTicketData.image}
                            alt={eventName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60 group-hover:opacity-100"
                          />
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-gray-700 text-xs font-mono text-white">
                            #{listing.tokenId}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{eventName}</h3>
                            <div className="space-y-2">
                              <p className="flex items-center text-gray-400 text-sm">
                                <Calendar className="w-4 h-4 mr-2 text-purple-500" /> {date}
                              </p>
                              <p className="flex items-center text-gray-400 text-sm">
                                <MapPin className="w-4 h-4 mr-2 text-purple-500" /> {location}
                              </p>
                            </div>
                          </div>

                          <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-800">
                            <div className="text-lg font-bold text-white">
                              {ethers.formatEther(listing.price)} <span className="text-sm text-purple-400">AVAX</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions Overlay / Bottom Bar */}
                        <div className="p-4 bg-black/20 flex gap-3">
                          <button
                            onClick={() => setViewTicket(fullTicketData)}
                            className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          <button
                            onClick={() => handleBuyResaleTicket(listing.tokenId, listing.price)}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {resaleListings.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-500">No tickets found matching your criteria.</p>
                </div>
              )}
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

      {/* Ticket Preview Modal */}
      {viewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-5xl w-full">
            <button
              onClick={() => setViewTicket(null)}
              className="absolute -top-12 right-0 md:-right-8 text-gray-400 hover:text-white p-2"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="overflow-x-auto pb-4 flex justify-center">
              <div className="scale-75 sm:scale-90 md:scale-100 origin-center">
                {/* @ts-ignore */}
                <EventverseTicket ticket={viewTicket} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuantumTicketResale


