// import { ethers } from "ethers"

// export interface Ticket {
//   id: string
//   event: string
//   originalPrice: number
//   currentPrice: number
//   owner: string
//   isForSale: boolean
// }

// export interface Transaction {
//   id: string
//   ticketId: string
//   from: string
//   to: string
//   price: number
//   timestamp: number
// }

// // ... (keep existing functions)

// export const listTicketForResale = async (contract: ethers.Contract, tokenId: number, price: number): Promise<void> => {
//   const priceInWei = ethers.parseEther(price.toString())
//   const tx = await contract.listTicketForSale(tokenId, priceInWei)
//   await tx.wait()
// }

// export const buyResaleTicket = async (contract: ethers.Contract, tokenId: number, price: number): Promise<void> => {
//   const tx = await contract.buyResaleTicket(tokenId, { value: price })
//   await tx.wait()
// }

// export const cancelResaleListing = async (contract: ethers.Contract, tokenId: number): Promise<void> => {
//   const tx = await contract.cancelResaleListing(tokenId)
//   await tx.wait()
// }

// export const getTicketDetails = async (contract: ethers.Contract, tokenId: number): Promise<Ticket> => {
//   const details = await contract.getTicketDetails(tokenId)
//   return {
//     id: tokenId.toString(),
//     event: "Quantum Realm Experience",
//     originalPrice: ethers.formatEther(details.price),
//     currentPrice: ethers.formatEther(details.price),
//     owner: details.owner,
//     isForSale: details.isForSale,
//   }
// // }

