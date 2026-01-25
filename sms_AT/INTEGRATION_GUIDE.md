# SMS USSD Integration with Event Server

## Overview
This USSD service integrates with the EventVax server to fetch real-time event data and enable ticket purchases via M-Pesa.

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   USSD Service      │  HTTP   │   EventVax Server    │
│   (Port 3000)       │ ◄─────► │   (Port 8080)        │
│                     │         │                      │
│  - Africa's Talking │         │  - Event Management  │
│  - M-Pesa (IntaSend)│         │  - SQLite Database   │
│  - MongoDB (Tickets)│         │  - REST API          │
└─────────────────────┘         └──────────────────────┘
```

## Setup

### 1. Install Dependencies
```bash
cd ~/code/joe/event-vax/sms_AT
npm install
```

### 2. Configure Environment Variables
The `.env` file should include:
```env
# MongoDB for ticket storage
MONGODB_URI=mongodb://127.0.0.1:27017/event-vax

# IntaSend M-Pesa Configuration
INTASEND_PUBLIC_KEY=your_public_key
INTASEND_PRIVATE_KEY=your_private_key
INTASEND_ENV=test

# Server API Configuration
SERVER_API_URL=http://localhost:8080/api

# Service Port
PORT=3000
```

### 3. Start Both Services

#### Terminal 1 - Start Event Server
```bash
cd ~/code/joe/event-vax/server
npm start
```

#### Terminal 2 - Start USSD Service
```bash
cd ~/code/joe/event-vax/sms_AT
npm start
```

## How It Works

### Event Data Flow
1. **USSD Service** calls the Event Service (`backend/eventService.js`)
2. **Event Service** makes HTTP requests to `http://localhost:8080/api/events`
3. **Server** returns events from the SQLite database
4. **USSD Service** displays events to users via USSD menu

### Key Files

#### `/backend/eventService.js`
- `fetchAllEvents()` - Fetches all events from server
- `fetchEventById(id)` - Fetches single event
- `getEventsList()` - Returns formatted event list for USSD
- `getEventMap()` - Creates event mapping for menu navigation

#### `/index.js`
- Main USSD application
- Integrates with eventService for dynamic event data
- Handles M-Pesa payments via IntaSend
- Stores tickets in MongoDB

## USSD Menu Structure

```
Welcome to AVARA
├── 1. Buy Ticket
│   ├── Select Event (dynamically loaded from server)
│   └── Pay with M-Pesa
├── 2. My Tickets
├── 3. Wallet
│   ├── Balance
│   ├── Deposit
│   └── Withdraw
├── 4. Events Near Me (grouped by venue)
└── 5. Support
```

## API Endpoints Used

### From EventVax Server
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event

### USSD Service Endpoints
- `POST /ussd` - USSD callback endpoint
- `GET /health` - Health check

## Features

✅ **Dynamic Event Loading** - Events are fetched from server in real-time  
✅ **Venue-Based Filtering** - Events grouped by venue/location  
✅ **M-Pesa Integration** - STK push for payments via IntaSend  
✅ **Ticket Management** - Store and retrieve tickets via phone number  
✅ **Rate Limiting** - 60 requests per minute per IP  
✅ **Security** - Helmet.js middleware enabled  

## Testing

### Check if services are running
```bash
# Check USSD service
curl http://localhost:3000/health

# Check Event server
curl http://localhost:8080/health
```

### Test event fetching
```bash
# Get all events
curl http://localhost:8080/api/events
```

## Troubleshooting

### Events not showing in USSD
1. Ensure server is running on port 8080
2. Check `SERVER_API_URL` in `.env`
3. Verify events exist in database: `curl http://localhost:8080/api/events`

### MongoDB connection issues
1. Ensure MongoDB is running: `sudo systemctl status mongod`
2. Check `MONGODB_URI` in `.env`

### M-Pesa payment issues
1. Verify IntaSend credentials in `.env`
2. Check phone number format (254XXXXXXXXX)
3. Ensure INTASEND_ENV is set correctly (test/live)

## Development

### Adding new USSD menu options
Edit `index.js` and add new conditions in the `/ussd` route handler.

### Modifying event display format
Edit `backend/eventService.js` to change how events are formatted.

## Production Deployment

1. Use environment-specific `.env` files
2. Enable production MongoDB instance
3. Update `SERVER_API_URL` to production server URL
4. Set `INTASEND_ENV=live` for live M-Pesa
5. Use ngrok or similar for USSD webhook URL

## Notes

- The USSD service stores tickets in MongoDB
- Events are managed via the EventVax server
- Both services must be running for full functionality
- Default limits: 9 events per USSD page (USSD menu constraint)
