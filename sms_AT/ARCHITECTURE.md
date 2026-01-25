# EventVax USSD Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
│                    (Dials USSD *123#)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AFRICA'S TALKING GATEWAY                        │
│                   (USSD Service Provider)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP POST /ussd
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SMS USSD SERVICE                              │
│                   (Port 3000 - index.js)                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              USSD Menu Handler                        │      │
│  │  • Buy Ticket                                        │      │
│  │  • My Tickets                                        │      │
│  │  • Wallet                                            │      │
│  │  • Events Near Me                                    │      │
│  │  • Support                                           │      │
│  └────────────┬─────────────────────┬────────────────────┘      │
│               │                     │                            │
│               │                     │                            │
│  ┌────────────▼──────────┐    ┌────▼─────────────────┐         │
│  │   Event Service       │    │   Payment Service     │         │
│  │  (eventService.js)    │    │   (IntaSend M-Pesa)  │         │
│  └────────────┬──────────┘    └──────────────────────┘         │
└───────────────┼─────────────────────────────────────────────────┘
                │
                │ HTTP GET /api/events
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EVENTVAX SERVER                               │
│                   (Port 8080 - server.js)                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                 REST API Routes                       │      │
│  │  • GET  /api/events      - All events               │      │
│  │  • GET  /api/events/:id  - Single event             │      │
│  │  • POST /api/events      - Create event             │      │
│  │  • PUT  /api/events/:id  - Update event             │      │
│  └────────────┬─────────────────────────────────────────┘      │
│               │                                                  │
│  ┌────────────▼──────────┐                                      │
│  │   Database Layer      │                                      │
│  │   (database.js)       │                                      │
│  └────────────┬──────────┘                                      │
└───────────────┼─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SQLITE DATABASE                               │
│                   (data/events.db)                               │
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │  events Table    │      │  tickets Table   │                │
│  │  • id            │      │  • id            │                │
│  │  • event_name    │      │  • event_id      │                │
│  │  • venue         │      │  • wallet_addr   │                │
│  │  • event_date    │      │  • tier_id       │                │
│  │  • regular_price │      │  • qr_code       │                │
│  │  • vip_price     │      └──────────────────┘                │
│  │  • description   │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

                        ┌──────────────────────┐
                        │   MONGODB            │
                        │  (Ticket Storage)    │
                        │  • phoneNumber       │
                        │  • eventId           │
                        │  • ticketCode        │
                        │  • price             │
                        └──────────────────────┘

```

## Data Flow Sequence

### 1. User Browses Events

```
User → USSD Gateway → USSD Service → Event Service → Server → SQLite
                                                              ↓
                                            Events List ← ← ← ←
```

### 2. User Purchases Ticket

```
User Selects Event
       ↓
USSD Service
       ├→ Event Service (Get Event Details)
       │         ↓
       │    Server → SQLite (Fetch Event)
       │         ↓
       │    Return Event Info
       │
       └→ IntaSend (Initiate M-Pesa STK Push)
              ↓
         User's Phone (M-Pesa Prompt)
              ↓
         Payment Confirmed
              ↓
       Save to MongoDB (Ticket Record)
              ↓
       Send Ticket Code via SMS
```

## Component Details

### USSD Service (Port 3000)
**Tech Stack:**
- Node.js + Express
- Africa's Talking SDK
- IntaSend (M-Pesa)
- MongoDB (Mongoose)
- Axios (HTTP Client)

**Responsibilities:**
- Handle USSD menu navigation
- Fetch events from server
- Process M-Pesa payments
- Store ticket records
- Send SMS confirmations

### EventVax Server (Port 8080)
**Tech Stack:**
- Node.js + Express (ES Modules)
- better-sqlite3
- CORS middleware

**Responsibilities:**
- Manage event CRUD operations
- Store event data in SQLite
- Provide REST API for events
- Sync with blockchain (optional)

### Databases

**SQLite (events.db)**
- Stores event information
- Fast, serverless
- Used by EventVax Server

**MongoDB (event-vax)**
- Stores ticket purchases
- Links phone numbers to events
- Used by USSD Service

## API Endpoints

### EventVax Server API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events |
| GET | `/api/events/:id` | Get single event |
| POST | `/api/events` | Create new event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| GET | `/health` | Health check |

### USSD Service API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ussd` | USSD callback handler |
| GET | `/health` | Health check |

## Security Features

- ✅ Rate limiting (60 req/min)
- ✅ Helmet.js security headers
- ✅ CORS enabled
- ✅ Environment variables for secrets
- ✅ Proxy trust for ngrok/reverse proxy

## Scalability Considerations

1. **Event Caching** - Can add Redis for frequent event queries
2. **Database Indexing** - SQLite indexes on frequently queried fields
3. **Load Balancing** - Multiple USSD service instances
4. **Queue System** - Bull/Redis for payment processing
5. **CDN** - For event images/assets

## Monitoring Points

- USSD response times
- Event fetch latency
- M-Pesa success rates
- Database query performance
- Error rates and types

---

**Architecture Version:** 1.0  
**Last Updated:** 2026-01-25
