/**
 * Predefined responses for the EventVax ticketing chatbot
 * This centralized file makes it easy to update and maintain chatbot responses
 */

export function getEventTicketingResponses() {
  return {
    // Regular greeting responses
    greetings: [
      "Hello! I'm the EventVax assistant. I can help you purchase blockchain-secured event tickets, create events, or manage your existing tickets. What would you like help with today?",
      "Hi there! Welcome to EventVax. I'm here to help you with blockchain-based event ticketing. How can I assist you?",
      "Welcome to EventVax! I'm your personal assistant for NFT event tickets. Whether you want to buy, sell, or create event tickets, I'm here to help you through the process."
    ],
    
    // Short greetings for combination responses
    shortGreetings: [
      "Hi there!",
      "Hello!",
      "Greetings!",
      "Hi!"
    ],
    
    // General help response - more organized and detailed than before
    help: "I'm your EventVax assistant and can help with:\n\n• **Purchasing Tickets**: Buy NFT tickets with cryptocurrency\n• **Wallet Connection**: Set up and connect your MetaMask or other wallet\n• **Ticket Management**: Transfer or resell your tickets\n• **Event Creation**: Create and manage your own events\n• **Ticket Validation**: Use QR codes to validate tickets at events\n• **Technical Support**: Troubleshoot common issues\n\nJust ask me a specific question about any of these topics!",
    
    // Fallback responses when no intent is matched
    fallback: [
      "I'm not sure I understand your question about EventVax. Could you rephrase it or ask about ticket purchasing, wallet connection, or event creation?",
      "I don't have information about that specific topic yet. I can help with buying tickets, connecting wallets, creating events, or managing your NFT tickets. What would you like to know?",
      "I'm still learning, but I'm best at answering questions about EventVax's ticketing process. Could you ask something about purchasing, transferring, or validating tickets?"
    ],
    
    // Intent-based responses
    intents: {
      ticket_purchase: {
        patterns: ["buy ticket", "purchase ticket", "get ticket", "how to buy", "ticket price", "cost of ticket", "how do i purchase", "how can i buy"],
        keywords: ["buy", "purchase", "acquire", "ticket", "price", "cost", "crypto", "payment"],
        questionResponses: {
          "how do i": "To purchase a ticket on EventVax:\n\n1. Connect your crypto wallet (click 'Connect Wallet' in the top right)\n2. Navigate to the 'Events' page to browse available events\n3. Select your desired event and click 'Buy Tickets'\n4. Choose the number of tickets you want\n5. Confirm the transaction in your wallet\n6. Pay the ticket price plus a small gas fee in AVAX\n\nOnce the blockchain transaction is confirmed (usually within 1-2 minutes), the ticket NFT will appear in your connected wallet and in your 'My Tickets' section on EventVax.",
          "how much": "Ticket prices vary by event and are set by the event organizers. Prices are displayed in AVAX cryptocurrency. Most events on EventVax range from 0.05 AVAX to 5 AVAX per ticket. Premium events may cost more. You'll also need to pay a small gas fee (typically 0.001-0.005 AVAX) to process the transaction on the Avalanche blockchain."
        },
        responses: [
          "To purchase a ticket on EventVax:\n\n1. Connect your crypto wallet (click 'Connect Wallet' in the top right)\n2. Navigate to the 'Events' page to browse available events\n3. Select your desired event and click 'Buy Tickets'\n4. Choose the number of tickets you want\n5. Confirm the transaction in your wallet\n6. Pay the ticket price plus a small gas fee in AVAX\n\nOnce the blockchain transaction is confirmed (usually within 1-2 minutes), the ticket NFT will appear in your connected wallet and in your 'My Tickets' section on EventVax.",
          "EventVax tickets are purchased with AVAX cryptocurrency on the Avalanche blockchain. Each ticket is minted as a unique NFT that proves your ownership and prevents counterfeiting. To buy:\n\n• You'll need a crypto wallet (MetaMask recommended)\n• Ensure your wallet has enough AVAX for the ticket price plus gas fees\n• Browse events, select tickets, and confirm the purchase in your wallet\n\nThe exact price depends on the event as set by organizers."
        ]
      },
      
      wallet_connection: {
        patterns: ["connect wallet", "wallet connection", "metamask", "how to connect", "wallet issue", "link wallet", "attach wallet"],
        keywords: ["wallet", "metamask", "connect", "crypto", "avalanche", "chain", "network"],
        questionResponses: {
          "what wallet": "EventVax supports any Ethereum-compatible wallet that works with the Avalanche C-Chain. The most popular options are:\n\n• MetaMask (recommended for beginners)\n• Coinbase Wallet\n• Trust Wallet\n• WalletConnect-compatible wallets\n\nWe recommend MetaMask as it's the most widely used and has the best compatibility with our platform."
        },
        responses: [
          "To connect your wallet to EventVax:\n\n1. Install a compatible wallet (MetaMask recommended) from your browser's extension store\n2. Set up your wallet and add some AVAX cryptocurrency\n3. Configure your wallet to use the Avalanche C-Chain (Chain ID: 0xA86A)\n4. On EventVax, click the 'Connect Wallet' button in the top right corner\n5. Select your wallet provider from the list\n6. Approve the connection request in your wallet popup\n\nYour wallet address should now appear in the top right, indicating you're connected!",
          "EventVax requires a connected cryptocurrency wallet to purchase and store your NFT tickets. We support MetaMask and other Ethereum-compatible wallets. To connect:\n\n• Click 'Connect Wallet' in the top navigation\n• Select your wallet provider\n• Approve the connection in your wallet\n\nMake sure your wallet is configured for the Avalanche C-Chain network (Chain ID: 0xA86A). If you have connection issues, check that you're on the correct network and that you have the latest wallet software."
        ]
      },
      
      ticket_transfer: {
        patterns: ["transfer ticket", "send ticket", "give ticket", "ticket to friend", "share ticket"],
        keywords: ["transfer", "send", "give", "share", "friend", "gift"],
        responses: [
          "To transfer an EventVax ticket to someone else:\n\n1. Go to the 'My Tickets' section in your account\n2. Select the specific ticket you want to transfer\n3. Click the 'Transfer' button\n4. Enter the recipient's wallet address (must be an Avalanche C-Chain address)\n5. Confirm the transfer details\n6. Sign the transaction with your wallet\n7. Pay a small gas fee (typically 0.001-0.002 AVAX)\n\nThe NFT ticket will be sent directly to the recipient's wallet address and will appear in their 'My Tickets' section if they use EventVax. No further action is needed.",
          "EventVax tickets are NFTs (Non-Fungible Tokens) on the Avalanche blockchain, which means they can be easily transferred to anyone with a compatible wallet. To transfer a ticket:\n\n• Navigate to 'My Tickets' in your account\n• Select the ticket and click 'Transfer'\n• Enter the recipient's wallet address\n• Confirm the transaction in your wallet\n\nThe transfer is recorded on the blockchain, providing a secure and transparent chain of ownership. The recipient will automatically have full access to the ticket, including entry to the event."
        ]
      },
      
      ticket_resale: {
        patterns: ["resell ticket", "sell ticket", "ticket marketplace", "secondary market", "sell my ticket"],
        keywords: ["resell", "sell", "marketplace", "secondary", "market", "profit", "resale"],
        responses: [
          "To resell your EventVax ticket on our Quantum Ticket Resale marketplace:\n\n1. Navigate to the 'My Tickets' section\n2. Select the ticket you wish to resell\n3. Click the 'List for Resale' button\n4. Set your asking price (in AVAX)\n5. Confirm the listing by signing the transaction in your wallet\n\nYour ticket will be listed on our marketplace for others to purchase. When someone buys your ticket:\n\n• The NFT transfers automatically to the buyer\n• You receive the payment minus a 2.5% platform fee\n• The funds are sent directly to your wallet\n\nYou can delist your ticket at any time if it hasn't sold yet.",
          "EventVax offers a secure peer-to-peer resale marketplace for tickets called Quantum Ticket Resale. This allows you to sell tickets you can no longer use:\n\n• Only tickets for verified events can be resold\n• You can set your own asking price\n• A 2.5% platform fee applies to all resales\n• Smart contracts handle the secure exchange of the ticket NFT for payment\n\nThis system prevents scalping and fraud while giving you flexibility to resell if your plans change. Visit the Resell section from your My Tickets page to list a ticket."
        ]
      },
      
      event_creation: {
        patterns: ["create event", "host event", "make event", "sell my tickets", "organize event", "start event"],
        keywords: ["create", "organize", "host", "event", "venue", "sell", "organize"],
        responses: [
          "To create an event on EventVax and sell NFT tickets:\n\n1. Connect your wallet (must have at least 0.1 AVAX for contract deployment)\n2. Click 'Create Event' in the main navigation\n3. Fill in your event details:\n   • Event name, description, and category\n   • Date, time, and duration\n   • Venue location and capacity\n   • Upload event images/banner\n4. Set ticket parameters:\n   • Total number of tickets available\n   • Price per ticket in AVAX\n   • Optional ticket tiers (General, VIP, etc.)\n   • Sales start and end dates\n5. Review and confirm by signing the transaction\n\nYour event will be created on the blockchain, and tickets will be available for purchase immediately according to your defined sales period. You'll have access to an organizer dashboard to track sales, validate tickets, and manage your event.",
          "EventVax allows anyone to create and sell tickets for their events using blockchain technology. As an event organizer, you can:\n\n• Deploy a custom smart contract for your event (one-time fee of approximately 0.1 AVAX)\n• Set custom ticket prices, quantities, and sales periods\n• Access real-time analytics on ticket sales\n• Automatically receive payments directly to your wallet\n• Generate entrance QR codes for easy validation\n\nEvent creation requires a connected wallet, basic event details, and ticket configuration. EventVax charges a 1% fee on primary ticket sales, significantly lower than traditional ticketing platforms."
        ]
      },
      
      ticket_validation: {
        patterns: ["validate ticket", "scan ticket", "ticket qr", "use ticket", "enter event", "check-in"],
        keywords: ["validate", "scan", "qr", "enter", "venue", "check-in", "entry"],
        responses: [
          "When attending an event with an EventVax ticket, the validation process is simple:\n\n1. Open the EventVax app or website on your mobile device\n2. Go to 'My Tickets' and select the appropriate ticket\n3. Tap 'Show QR Code' to display your validation code\n4. Present this QR code to the event staff at entry\n\nThe QR code contains encrypted blockchain data that proves:\n• You are the legitimate owner of the ticket NFT\n• The ticket is valid for this specific event\n• The ticket hasn't been used already (preventing duplicates)\n\nEvent staff will scan this code with the EventVax Validator app, which verifies the blockchain record in real-time, ensuring security and preventing fraud.",
          "EventVax tickets use blockchain technology for secure validation at events. Each ticket has a unique QR code that represents your ownership of the NFT ticket. To use your ticket:\n\n• Access your ticket from the 'My Tickets' section before the event\n• Display the QR code to event staff at the venue\n• They'll scan it with the EventVax Validator app\n• The system verifies the blockchain record in seconds\n• Once validated, your entry is recorded on-chain\n\nThis system prevents ticket duplication, ensures only valid tickets are accepted, and creates a transparent record of attendance."
        ]
      },
      
      technical_support: {
        patterns: ["problem", "issue", "help me", "not working", "error", "trouble", "support", "bug", "fix"],
        keywords: ["problem", "error", "issue", "help", "fix", "support", "trouble"],
        questionResponses: {
          "transaction": "If you're experiencing transaction issues:\n\n1. Check that your wallet has sufficient AVAX for both the ticket price and gas fees\n2. Ensure you're connected to the Avalanche C-Chain network\n3. Try increasing the gas limit slightly in your wallet settings\n4. If a transaction is pending for a long time, you may need to speed it up or cancel it from your wallet\n\nFor persistent issues, contact support@eventvax.com with your wallet address and transaction hash."
        },
        responses: [
          "For technical support with EventVax, please follow these troubleshooting steps:\n\n1. Wallet Connection Issues:\n   • Ensure you're using a supported wallet (MetaMask recommended)\n   • Verify you're connected to the Avalanche C-Chain (ID: 0xA86A)\n   • Try disconnecting and reconnecting your wallet\n\n2. Transaction Problems:\n   • Check that you have sufficient AVAX for the purchase plus gas fees\n   • Increase the gas limit slightly if transactions are failing\n\n3. Ticket Not Appearing:\n   • Allow 2-3 minutes for blockchain confirmation\n   • Refresh the 'My Tickets' page\n   • Verify the transaction was successful in your wallet history\n\nIf problems persist, contact support@eventvax.com with your wallet address and detailed description of the issue.",
          "If you're experiencing technical issues with EventVax, here's how to get help:\n\n• For wallet connection problems: Make sure you're on the Avalanche C-Chain network and try refreshing the page\n• For transaction failures: Check your AVAX balance and network status at https://status.avax.network\n• For missing tickets: Verify the transaction completed in your wallet and allow time for blockchain confirmation\n\nMost issues are resolved by refreshing the page, reconnecting your wallet, or waiting for network congestion to clear. For persistent problems, email support@eventvax.com with your wallet address and a screenshot of the error."
        ]
      }
    },
    
    // Event-specific information (example events)
    events: {
      "blockchain conference": "The Blockchain Innovation Summit is happening on July 15-16, 2025 at the Grand Convention Center. Tickets are available in three tiers:\n\n• Standard Access: 0.5 AVAX - Includes all keynotes and expo area\n• Developer Pass: 1.2 AVAX - Adds workshop access and developer networking events\n• VIP Experience: 3 AVAX - Full access including private sessions with speakers and exclusive networking events\n\nAll tickets are minted as NFTs on the Avalanche blockchain with special holder benefits. You can purchase these through the Events page with your connected wallet.",
      
      "music festival": "The Quantum Music Festival is scheduled for August 20-22, 2025 at Riverside Park. This three-day event features over 40 artists across multiple genres. Available ticket options:\n\n• Single Day Pass: 0.8 AVAX per day\n• Full Festival Pass: 2 AVAX (40% savings over buying individual days)\n• VIP Experience: 5 AVAX - Includes premium viewing areas, exclusive lounges, and artist meet-and-greets\n\nEarly bird tickets are currently available at a 15% discount until June 1, 2025. Each ticket is a unique NFT with integrated features for food/merchandise discounts at the venue.",
      
      "tech meetup": "The next Web3 Developers Meetup is on May 10, 2025 at the Downtown Innovation Hub. This is a free community event, but registration through EventVax is required for entry.\n\n• Attendance is free (you only pay the gas fee for the NFT ticket, typically around 0.001 AVAX)\n• The NFT ticket serves as proof of registration and grants you access to the event resources\n• Limited to 200 attendees, so register early\n• The event runs from 6:30 PM to 9:00 PM and includes technical talks, networking, and demonstrations\n\nRegister through the Events page by connecting your wallet and claiming a free ticket."
    }
  };
}
