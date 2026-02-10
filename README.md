# 🎟️ Eventverse.

## 🌍 Overview

Eventverse is a revolutionary blockchain-based ticketing platform engineered to combat fraud and inefficiencies in the event ticketing industry. Leveraging the Avalanche blockchain, our platform empowers event organizers to issue tickets as digital tokens, ensuring secure purchases, effortless resales, and QR-code-based authentication.

## ✨ Key Features,

### 🎟️ Decentralized Ticket Minting & Transfer

- Event organizers can mint unique, tamper-proof tickets with embedded event details.
- Blockchain-backed transparency guarantees authenticity and secure transfers.

### 🤖 AI Assistant

- An intelligent chatbot designed to help users navigate the EventVax platform
- Provides accurate, context-aware answers about ticket purchasing, wallet connections, event creation, and more
- Offers step-by-step guidance for blockchain interactions and NFT ticket management
- Features a beautiful floating UI that's accessible throughout the platform

### 📲 QR Code Verification

- Each ticket is embedded with a unique QR code for instant and tamper-proof validation.
- Eliminates counterfeit tickets and simplifies on-site verification.

### 🔐 Secure Blockchain Transactions

- Powered by Avalanche, enabling fast, transparent, and cost-efficient ticket purchases and resales.
- Immutable transaction records provide peace of mind for buyers and sellers.

### 🔄 Resale Marketplace

- A decentralized marketplace for verified resale, maintaining ticket integrity and fair pricing.
- Automated smart contracts prevent scalping and fraud.

## 🛠️ Tech Stack

### Languages & Frameworks


### Languages & Frameworks
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

### Blockchain
![Avalanche](https://img.shields.io/badge/Avalanche-E84142?style=for-the-badge&logo=avalanche&logoColor=white)
![Web3.js](https://img.shields.io/badge/Web3.js-F16822?style=for-the-badge&logo=web3.js&logoColor=white)

### Development Tools
![Foundry](https://img.shields.io/badge/Foundry-000000?style=for-the-badge&logo=ethereum&logoColor=white)
![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-4E5EE4?style=for-the-badge&logo=OpenZeppelin&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)




## 🚀 Getting Started

### Prerequisites

1. **Install Node.js:**

   ```bash
   # For Windows: Download and install from https://nodejs.org/
   
   # For Ubuntu/Debian
   sudo apt update
   sudo apt install nodejs npm
   
   # For macOS wicth Homebrew
   brew install node
   ```
   Verify installation with: `node --version` and `npm --version`

2. **Install Core Wallet:**

   Core is the recommended wallet for interacting with Avalanche and the EventVax platform.
   
   - **Download:** [https://core.app/](https://core.app/)
   - **Browser Extension:** Available for Chrome, Firefox, Brave, and Edge
   - **Mobile App:** Available on iOS and Android
   
   **Setup Steps:**
   1. Install the Core browser extension or mobile app
   2. Create a new wallet or import an existing one
   3. Securely backup your recovery phrase
   4. Switch to **Fuji Testnet** in network settings

3. **Get Test AVAX (Fuji Faucet):**

   You'll need test AVAX to interact with the platform on Fuji testnet.
   
   **Option 1: Official Avalanche Faucet**
   - Visit: [https://build.avax.network/console/primary-network/faucet](https://build.avax.network/console/primary-network/faucet)
   - Connect your Core wallet
   - Select "Fuji (C-Chain)"
   - Request test tokens (receive 0.5 AVAX)
   
   **Option 2: Core Faucet**
   - Open Core wallet
   - Navigate to the faucet section
   - Request test AVAX directly from the wallet interface
   
   > 💡 **Note:** Faucet requests are limited to once per 24 hours per address

4. **Clone the repository:**

   ```bash
   git clone https://github.com/JosephOkumu/event-vax.git

   ```

5. **Install dependencies:**

   ```bash
   npm install
   ```

6. **Compile smart contracts:**

   ```bash
   cd contracts
   forge build
   ```

7. **Configure Avalanche network:**
   Create `.env` file in `contracts/` directory:
   ```
   PRIVATE_KEY=your_private_key
   FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
   SNOWTRACE_API_KEY=your_api_key
   ```

8. **Deploy contracts (Already deployed to Fuji):**

   ```bash
   forge script script/Deploy.s.sol --rpc-url $FUJI_RPC_URL --broadcast --verify
   ```

9. **Run the application locally:**

   ```bash
   # First, install and run the backend server
   cd server
   npm install
   npm run dev
   
   # In a new terminal, run the frontend
   cd eventvax
   npm install
   npm run dev
   ```

> 💡 Contract addresses are configured in `src/config/contracts.js`

## 👥 The Team

| Name                | Role                 | Contact                                      |
| ------------------- | -------------------- | -------------------------------------------- |
| Williams Ochieng    | Smart Contract Dev   | [williams@example.com](mailto:williams@example.com) |
| Joseph Okumu Otieno | Full-stack Engineer  | [jokumu25@gmail.com](mailto:jokumu25@gmail.com) |
| John Mokaya         | Frontend Developer   | [mokayaj857@gmail.com](mailto:mokayaj857@gmail.com) |
| Phillip Ochieng    | Frontend Developer    | [oumaphilip01@gmail.com](mailto:oumaphilip01@gmail.com) |
| Ouma Ouma         | Full-Stack Enginee   | [ouma.godwin10@gmail.com](mailto:ouma.godwin10@gmail.com) |


### 🌐 Waitlist Landing Page Integration

<img width="945" alt="Screenshot 2025-01-21 151558" src="https://github.com/user-attachments/assets/36aff1b1-6c2f-476d-b0ea-8729c0a52148" />


#### Key Deliverables:

1. **Landing Page Design**

   <img width="948" alt="Screenshot 2025-01-21 151517" src="https://github.com/user-attachments/assets/786b0fb1-92c5-4433-89bd-6c7282ea8e69" />

2. **Tickets collection**
   <img width="950" alt="Screenshot 2025-01-21 161518" src="https://github.com/user-attachments/assets/cd58022e-d42d-4327-b3f6-ec45d496d4d8" />
   
3. **Ticket sales**

 <img width="960" alt="Screenshot 2025-01-21 151643" src="https://github.com/user-attachments/assets/a222522c-71fc-47df-b6f0-a775ed58cd11" />

4. **Ticket Minting**
   <img width="959" alt="Screenshot 2025-01-21 151623" src="https://github.com/user-attachments/assets/f773d40b-760f-4021-aaf0-0ea4d87e677e" />

4. **QR code Intergration**
   <img width="947" alt="Screenshot 2025-01-21 162251" src="https://github.com/user-attachments/assets/99520049-8a10-4ae3-b538-2e6b0bc5df7b" />


5. **Go Live!**

   - Promote the page across social media and mailing lists.
     



## 🎥 Project Video Demo

<p align="center">
  <a href="https://drive.google.com/file/d/1Z5Q1POLNw9g6Vq8ph7jJq1FduJROfza0/view?usp=sharing" target="_blank">
    <img src="https://img.icons8.com/clouds/500/video-playlist.png" alt="Watch Project Video" width="60%" />
  </a>
</p>

📽️ **Click the image above to watch the full project demo hosted on Google Drive.**






## ⛰️ Avalanche Integration

### 🚀 Why Avalanche?

- **Speed & Efficiency:** Lightning-fast finality for instant ticket transfers within 2 seconds.
- **Low Costs:** Affordable transactions for users and event organizers.
- **💰 Cost Efficiency**
   - Minimal transaction fees
   - Economical for both users and operators

### 🔗 Deployment Strategy

- Our smart contracts are deployed on Avalanche's C-Chain to facilitate secure ticket operations.
- Robust deployment pipeline via Foundry ensures reliability.

### 📍 Live Contracts (Fuji Testnet)

| Contract | Address |
|----------|----------|
| EventFactory | `0x4FC9267E6Ef419be7700e3936Fc51D2835e257D0` |
| Marketplace | `0x072c6707E3fd1Bcc2f2177349402Ad5fdeB82F51` |
| EventManager | `0x5876444b87757199Cd08f44193Bf7741FDA01EAD` |
| QR Verification | `0x89dABaf2dC7aF4C06AF993E083115952cCd67E86` |
| POAP | `0x323A6ddC3390192013bfe09Ea7d677c7469078c4` |
| EventBadge | `0xCB3c41286536004dee308520B4D1F64de20157DB` |
| TicketNFT Implementation | `0x520B9d1C86d2dD58b5929AC159aF06508160aDec` |
| MetadataRegistry | `0xCD2bA7f0941A0A79aC791Fb5D72E493557c37241` |

**Explorer:** [View on Snowtrace](https://testnet.snowtrace.io/)

**Deployment Details:** See [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## 🔮 Vision.

Eventverse is redefining event ticketing by combining blockchain security with intuitive user experiences. Stay tuned for exciting updates and new features as we shape the future of event access!

## 📊 Project Status
![Development Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![Build Status](https://img.shields.io/badge/Build-Passing-success?style=for-the-badge)
![Test Coverage](https://img.shields.io/badge/Coverage-85%25-green?style=for-the-badge)

