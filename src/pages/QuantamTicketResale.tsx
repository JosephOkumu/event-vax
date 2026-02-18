"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Wallet, Loader2, AlertCircle, Tag, ShoppingCart, Search, Filter, Eye, X, Calendar, MapPin, Ticket as TicketIcon } from "lucide-react"
import { useWallet } from '../contexts/WalletContext'
import EventverseTicket from '../components/EventverseTicket'
import { CONTRACTS } from '../config/contracts'

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
  id: string
  tierId: string
  owner: string
  isForSale: boolean
  price: bigint
  eventName?: string
  image?: string
  contractAddress?: string
  quantity?: number
  originalPrice?: string
}

interface ResaleListing {
  tokenId: string
  owner: string
  isForSale: boolean
  price: bigint
  eventName?: string
  eventDate?: string
  venue?: string
  image?: string
}

const MARKETPLACE_ADDRESS = CONTRACTS.MARKETPLACE
const MARKETPLACE_ABI = [
  "function listTicket(address ticketContract, uint256 tierId, uint256 amount, uint256 price) external returns (uint256)",
  "function buyTicket(uint256 listingId) external payable",
  "function cancelListing(uint256 listingId) external",
  "function getActiveListings() external view returns (uint256[] memory)",
  "function getListing(uint256 listingId) external view returns (tuple(address seller, address ticketContract, uint256 tierId, uint256 amount, uint256 price, uint256 listedAt, bool active))",
]

const MAX_PROFIT_PERCENTAGE = 20 // Maximum 20% profit allowed on resale

const QuantumTicketResale = () => {
  const { walletAddress, isConnecting, connectWallet, disconnectWallet, isConnected, validateNetwork } = useWallet()
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userTickets, setUserTickets] = useState<Ticket[]>([])
  const [resaleListings, setResaleListings] = useState<ResaleListing[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [viewTicket, setViewTicket] = useState<ResaleListing | Ticket | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [profitPercentage, setProfitPercentage] = useState<string>("10")
  const [selectedTicketForListing, setSelectedTicketForListing] = useState<Ticket | null>(null)
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

    console.log('🎫 Fetching user tickets for:', walletAddress)
    try {
      const response = await fetch(`http://localhost:8080/api/tickets/wallet/${walletAddress}`)
      const data = await response.json()
      console.log('📥 Received ticket data:', data)
      
      if (data.success && data.tickets) {
        const provider = new ethers.BrowserProvider(window.ethereum!)
        const ticketsWithVerification: Ticket[] = []

        for (const ticket of data.tickets) {
          if (!ticket.contract_address || ticket.tier_id === undefined) continue

          try {
            const nftABI = ["function balanceOf(address account, uint256 id) external view returns (uint256)"]
            const nftContract = new ethers.Contract(ticket.contract_address, nftABI, provider)
            const balance = await nftContract.balanceOf(walletAddress, ticket.tier_id)

            if (balance > 0) {
              console.log(`✅ Verified ticket ${ticket.id} - Balance: ${balance}, Price: ${ticket.price}`)
              ticketsWithVerification.push({
                id: ticket.id.toString(),
                tierId: ticket.tier_id.toString(),
                owner: walletAddress,
                isForSale: false,
                price: BigInt(0),
                eventName: ticket.event_name,
                image: ticket.flyer_image || `https://images.unsplash.com/photo-1540575467063?w=800&h=400&fit=crop`,
                contractAddress: ticket.contract_address,
                quantity: Number(balance),
                originalPrice: ticket.price
              })
            } else {
              console.log(`⚠️ Ticket ${ticket.id} has zero balance`)
            }
          } catch (error) {
            console.error(`Error verifying ticket ${ticket.id}:`, error)
          }
        }

        console.log(`✅ Total verified tickets: ${ticketsWithVerification.length}`)
        setUserTickets(ticketsWithVerification)
      } else {
        console.log('⚠️ No tickets found in response')
        setUserTickets([])
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      setUserTickets([])
    }
  }

  const updateResaleListings = async () => {
    console.log('🛒 Fetching resale listings from marketplace:', MARKETPLACE_ADDRESS)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider)
      const activeListingIds = await contract.getActiveListings()
      console.log(`📋 Found ${activeListingIds.length} active listings:`, activeListingIds)
      const listings: ResaleListing[] = []
      
      for (const listingId of activeListingIds) {
        const listing = await contract.getListing(listingId)
        console.log(`📦 Listing #${listingId}:`, {
          seller: listing.seller,
          ticketContract: listing.ticketContract,
          tierId: listing.tierId.toString(),
          price: ethers.formatEther(listing.price),
          active: listing.active
        })
        
        let ticketInfo = null
        try {
          const response = await fetch(`http://localhost:8080/api/tickets/wallet/${listing.seller}`)
          const result = await response.json()
          if (result.success && result.tickets) {
            ticketInfo = result.tickets.find((t: any) => 
              t.contract_address?.toLowerCase() === listing.ticketContract.toLowerCase() &&
              t.tier_id?.toString() === listing.tierId.toString()
            )
            if (ticketInfo) {
              console.log(`✅ Found ticket info for listing #${listingId}:`, ticketInfo.event_name)
            } else {
              console.log(`⚠️ No matching ticket info for listing #${listingId}`)
            }
          }
        } catch (err) {
          console.error(`❌ Failed to fetch ticket info for listing #${listingId}:`, err)
        }

        listings.push({
          tokenId: listingId.toString(),
          owner: listing.seller,
          isForSale: listing.active,
          price: listing.price,
          eventName: ticketInfo?.event_name || `Event Ticket #${listingId}`,
          eventDate: ticketInfo?.event_date ? new Date(ticketInfo.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA',
          venue: ticketInfo?.venue || 'TBA',
          image: ticketInfo?.flyer_image || `https://images.unsplash.com/photo-${1540575467063 + parseInt(listingId.toString())}?w=800&h=400&fit=crop`
        })
      }

      console.log(`✅ Total resale listings loaded: ${listings.length}`)
      setResaleListings(listings)
    } catch (error) {
      console.error('❌ Error fetching resale listings:', error)
      setResaleListings([])
    }
  }

  const handleListForResale = async (ticket: Ticket, profitPercent: number) => {
    console.log('🏷️ Starting resale listing process:', { ticketId: ticket.id, profitPercent })
    try {
      setIsLoading(true)
      setError(null)

      if (!ticket.contractAddress || !ticket.tierId) {
        throw new Error('Invalid ticket data')
      }

      if (profitPercent < 0 || profitPercent > MAX_PROFIT_PERCENTAGE) {
        throw new Error(`Profit percentage must be between 0% and ${MAX_PROFIT_PERCENTAGE}%`)
      }

      const originalPrice = parseFloat(ticket.originalPrice || '0')
      if (originalPrice === 0) {
        throw new Error('Cannot list ticket: Original price not available')
      }
      const resalePrice = originalPrice * (1 + profitPercent / 100)
      console.log('💰 Price calculation:', { originalPrice, profitPercent, resalePrice })

      console.log('🔗 Validating network...')
      await validateNetwork()

      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      console.log('✅ Signer obtained:', await signer.getAddress())
      
      const nftABI = [
        "function balanceOf(address account, uint256 id) external view returns (uint256)",
        "function setApprovalForAll(address operator, bool approved) external",
        "function isApprovedForAll(address owner, address operator) external view returns (bool)"
      ]
      const nftContract = new ethers.Contract(ticket.contractAddress, nftABI, signer)
      
      const balance = await nftContract.balanceOf(walletAddress, ticket.tierId)
      console.log('🎫 Ticket balance check:', balance.toString())
      if (balance === 0n) {
        throw new Error('You do not own this ticket')
      }

      const isApproved = await nftContract.isApprovedForAll(walletAddress, MARKETPLACE_ADDRESS)
      console.log('🔐 Marketplace approval status:', isApproved)
      
      if (!isApproved) {
        console.log('⏳ Requesting marketplace approval...')
        const approveTx = await nftContract.setApprovalForAll(MARKETPLACE_ADDRESS, true, {
          maxFeePerGas: ethers.parseUnits('25', 'gwei'),
          maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
        })
        console.log('📝 Approval tx hash:', approveTx.hash)
        await approveTx.wait()
        console.log('✅ Marketplace approved')
      }

      const contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer)
      const priceInWei = ethers.parseEther(resalePrice.toString())
      console.log('📤 Listing ticket on marketplace:', {
        contract: ticket.contractAddress,
        tierId: ticket.tierId,
        amount: 1,
        priceInWei: priceInWei.toString(),
        priceInAVAX: resalePrice
      })
      
      const tx = await contract.listTicket(
        ticket.contractAddress,
        ticket.tierId,
        1,
        priceInWei,
        {
          maxFeePerGas: ethers.parseUnits('25', 'gwei'),
          maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
        }
      )
      console.log('📝 Listing tx hash:', tx.hash)
      await tx.wait()
      console.log('✅ Ticket listed successfully!')

      setSelectedTicketForListing(null)
      setProfitPercentage('10')
      console.log('🔄 Refreshing ticket lists...')
      await updateUserTickets()
      await updateResaleListings()

      console.log('🎉 Listing complete!')
      alert(`Ticket listed at ${resalePrice.toFixed(4)} AVAX (${profitPercent}% profit)!`)
    } catch (error: any) {
      console.error('❌ Error listing ticket:', error)
      console.error('Error details:', {
        code: error.code,
        reason: error.reason,
        message: error.message
      })
      if (error.code === 'ACTION_REJECTED') {
        setError('Transaction rejected by user')
      } else {
        setError(error.reason || error.message || "Failed to list ticket")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyResaleTicket = async (listingId: string, price: bigint) => {
    console.log('🛒 Starting purchase process:', { listingId, price: ethers.formatEther(price) })
    try {
      setIsLoading(true)
      setError(null)

      console.log('🔗 Validating network...')
      await validateNetwork()

      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      console.log('✅ Buyer address:', await signer.getAddress())
      const contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer)

      console.log('💳 Purchasing ticket from marketplace...')
      const tx = await contract.buyTicket(listingId, {
        value: price,
        maxFeePerGas: ethers.parseUnits('25', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei')
      })
      console.log('📝 Purchase tx hash:', tx.hash)
      await tx.wait()
      console.log('✅ Purchase successful!')

      console.log('🔄 Refreshing ticket lists...')
      await updateUserTickets()
      await updateResaleListings()

      console.log('🎉 Purchase complete!')
      alert("Resale ticket purchased successfully!")
    } catch (error: any) {
      console.error('❌ Error buying resale ticket:', error)
      console.error('Error details:', {
        code: error.code,
        reason: error.reason,
        message: error.message
      })
      setError((error as Error).message || "Failed to buy resale ticket. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateResalePrice = (originalPrice: string, profitPercent: number) => {
    const original = parseFloat(originalPrice || '0')
    if (original === 0) return 'N/A'
    return (original * (1 + profitPercent / 100)).toFixed(4)
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
                      key={ticket.id}
                      className="group bg-gray-900/50 backdrop-blur-md border border-gray-800 hover:border-purple-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-6 transition-all duration-300"
                    >
                      <div className="w-full sm:w-48 h-24 bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:shadow-lg transition-all">
                        <img
                          src={ticket.image}
                          alt={ticket.eventName}
                          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <span className="relative z-10 font-mono text-white font-bold text-xl drop-shadow-md">#{ticket.id}</span>
                      </div>

                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-lg font-bold text-white mb-1">{ticket.eventName || `Event Ticket #${ticket.id}`}</h3>
                        <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" /> 
                            Original: {ticket.originalPrice && ticket.originalPrice !== '0' && ticket.originalPrice !== '0.0' 
                              ? `${ticket.originalPrice} AVAX` 
                              : 'Price not available'}
                          </span>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto">
                        <button
                          onClick={() => {
                            console.log('🖱️ Set Price clicked for ticket:', ticket.id)
                            setSelectedTicketForListing(ticket)
                          }}
                          disabled={isLoading}
                          className="w-full px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Tag className="w-4 h-4" />
                          Set Price
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {resaleListings
                  .sort((a, b) => {
                    if (sortBy === 'price_asc') return Number(a.price) - Number(b.price);
                    if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
                    return 0;
                  })
                  .map((listing) => {
                    const fullTicketData = {
                      ...listing,
                      eventName: listing.eventName || `Event #${listing.tokenId}`,
                      eventDate: listing.eventDate || 'TBA',
                      venue: listing.venue || 'TBA',
                      image: listing.image || `https://images.unsplash.com/photo-${1540575467063 + parseInt(listing.tokenId)}?w=800&h=400&fit=crop`
                    };

                    return (
                      <div
                        key={listing.tokenId}
                        className="group bg-gray-900 border border-gray-800 hover:border-purple-500/50 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-purple-900/20 transition-all duration-300 flex flex-col"
                      >
                        <div className="h-48 bg-gray-800 relative overflow-hidden">
                          <img
                            src={fullTicketData.image}
                            alt={fullTicketData.eventName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60 group-hover:opacity-100"
                          />
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-gray-700 text-xs font-mono text-white">
                            #{listing.tokenId}
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{fullTicketData.eventName}</h3>
                            <div className="space-y-2">
                              <p className="flex items-center text-gray-400 text-sm">
                                <Calendar className="w-4 h-4 mr-2 text-purple-500" /> {fullTicketData.eventDate}
                              </p>
                              <p className="flex items-center text-gray-400 text-sm">
                                <MapPin className="w-4 h-4 mr-2 text-purple-500" /> {fullTicketData.venue}
                              </p>
                            </div>
                          </div>

                          <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-800">
                            <div className="text-lg font-bold text-white">
                              {ethers.formatEther(listing.price)} <span className="text-sm text-purple-400">AVAX</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-black/20 flex gap-3">
                          <button
                            onClick={() => setViewTicket(fullTicketData)}
                            className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          {listing.owner.toLowerCase() === walletAddress?.toLowerCase() ? (
                            <button
                              disabled
                              className="flex-1 py-2.5 rounded-xl bg-gray-600 text-gray-400 cursor-not-allowed text-sm font-bold flex items-center justify-center gap-2"
                            >
                              Your Listing
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBuyResaleTicket(listing.tokenId, listing.price)}
                              disabled={isLoading}
                              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy Now'}
                            </button>
                          )}
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

      {selectedTicketForListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Set Resale Price</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Original Price</label>
                <div className="text-xl font-bold text-white">
                  {selectedTicketForListing.originalPrice && selectedTicketForListing.originalPrice !== '0' 
                    ? `${selectedTicketForListing.originalPrice} AVAX` 
                    : 'Price not available'}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Profit Percentage (Max {MAX_PROFIT_PERCENTAGE}%)</label>
                <input
                  type="number"
                  min="0"
                  max={MAX_PROFIT_PERCENTAGE}
                  value={profitPercentage}
                  onChange={(e) => setProfitPercentage(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Resale Price</label>
                <div className="text-2xl font-bold text-purple-400">
                  {selectedTicketForListing.originalPrice && selectedTicketForListing.originalPrice !== '0'
                    ? `${calculateResalePrice(selectedTicketForListing.originalPrice, parseFloat(profitPercentage) || 0)} AVAX`
                    : 'N/A'}
                </div>
                <p className="text-xs text-gray-500 mt-1">+{profitPercentage}% profit</p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedTicketForListing(null)
                    setProfitPercentage('10')
                  }}
                  className="flex-1 py-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleListForResale(selectedTicketForListing, parseFloat(profitPercentage) || 0)}
                  disabled={isLoading || parseFloat(profitPercentage) > MAX_PROFIT_PERCENTAGE || parseFloat(profitPercentage) < 0 || !selectedTicketForListing.originalPrice || selectedTicketForListing.originalPrice === '0'}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'List Ticket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
