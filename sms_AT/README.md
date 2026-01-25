# EventVax USSD Service 🎫📱

SMS-based event ticketing system integrated with EventVax server, powered by Africa's Talking USSD and IntaSend M-Pesa.

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- MongoDB running
- EventVax Server running on port 8080

### Installation
```bash
npm install
```

### Start Services

**Option 1: Manual (Recommended)**
```bash
# Terminal 1 - Event Server
cd ~/code/joe/event-vax/server && npm start

# Terminal 2 - USSD Service
cd ~/code/joe/event-vax/sms_AT && npm start
```

**Option 2: Test Integration**
```bash
node test-integration.js
```

## 📚 Documentation

| File | Description |
|------|-------------|
| [QUICK_START.md](QUICK_START.md) | Quick commands & checklist |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | Complete setup guide |
| [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md) | Technical changes made |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture diagrams |
| [SMS_AT_DATA_OVERVIEW.md](SMS_AT_DATA_OVERVIEW.md) | Data flow overview |

## 🏗️ Architecture

```
User (USSD) → SMS Service → Event Service → EventVax Server → SQLite
                    ↓
                IntaSend (M-Pesa)
                    ↓
                MongoDB (Tickets)
```

## ✨ Features

- ✅ Dynamic event loading from EventVax server
- ✅ M-Pesa STK push payments via IntaSend
- ✅ Ticket generation and storage
- ✅ Venue-based event filtering
- ✅ Wallet management
- ✅ Support system
- ✅ Rate limiting & security

## 🔧 Configuration

Create `.env` file with:
```env
# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/event-vax

# IntaSend M-Pesa
INTASEND_PUBLIC_KEY=your_public_key
INTASEND_PRIVATE_KEY=your_private_key
INTASEND_ENV=test

# Server Integration
SERVER_API_URL=http://localhost:8080/api

# Service Port
PORT=3000
```

## 🧪 Testing

```bash
# Test integration
node test-integration.js

# Health checks
curl http://localhost:3000/health
curl http://localhost:8080/health

# Test USSD endpoint
curl -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "254712345678", "text": ""}'
```

## 📱 USSD Menu

```
Welcome to AVARA
├── 1. Buy Ticket
│   └── Select Event → Pay with M-Pesa
├── 2. My Tickets
├── 3. Wallet
│   ├── Balance
│   ├── Deposit
│   └── Withdraw
├── 4. Events Near Me
└── 5. Support
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ussd` | USSD callback handler |
| GET | `/health` | Service health check |

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **USSD**: Africa's Talking
- **Payments**: IntaSend (M-Pesa)
- **Database**: MongoDB (tickets), SQLite (events via server)
- **HTTP Client**: Axios

## 📦 Project Structure

```
sms_AT/
├── backend/
│   ├── db.js              # MongoDB connection
│   ├── eventService.js    # Event fetching from server
│   └── models/            # Database models
├── index.js               # Main USSD application
├── test-integration.js    # Integration tests
├── start-services.sh      # Service startup script
└── *.md                   # Documentation
```

## 🔐 Security

- Rate limiting: 60 requests/minute
- Helmet.js security headers
- CORS enabled
- Environment variables for secrets
- Proxy trust for ngrok

## 🐛 Troubleshooting

**No events showing?**
Check if server is running and has events

**MongoDB connection error?**
Start MongoDB service

**Port already in use?**
Find and stop the conflicting process

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for detailed troubleshooting.

## 📄 License

ISC

## 👨‍💻 Author

EventVax Team

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** 2026-01-25
