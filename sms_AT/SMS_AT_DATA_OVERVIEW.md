# 📱 SMS_AT (USSD Ticketing System) - Complete Data Overview

**Location:** `/home/junia-loves-juniour/code/event-vax/sms_AT`  
**Date Generated:** 2026-01-25

---

## 🎯 System Overview

**SMS_AT** is a USSD-based event ticketing system that enables feature phone users to purchase event tickets using M-Pesa payments via Africa's Talking and IntaSend integration.

---

## 📂 Project Structure

```
sms_AT/
├── 📄 index.js                    # Main USSD server (230 lines)
├── 📄 package.json                # Dependencies
├── 📄 package-lock.json           # Locked dependencies
├── 📄 .env                        # Environment configuration (SENSITIVE)
├── 📂 backend/
│   ├── 📄 db.js                  # MongoDB connection handler
│   └── 📂 models/
│       └── 📄 Transaction.js     # Transaction schema
├── 📂 node_modules/               # Installed packages
└── 📂 .vscode/                    # VS Code settings
```

---

## 🔑 Environment Configuration

### Database
```env
MONGODB_URI=mongodb+srv://mokayaj857_db_user:***@cluster0.jyao82t.mongodb.net/
PORT=3000
```

### Africa's Talking (USSD)
```env
AFRICASTALKING_USERNAME=Sandbox
AFRICASTALKING_API_KEY=atsk_af5090edecd73b2624fbaa78737342cd47e9d455012da946a2517b0fcf7e046f66fc847f
```

### IntaSend (M-Pesa Payments)
```env
INTASEND_PUBLIC_KEY=ISPubKey_test_25f5da52-b900-49ff-8163-265cb767b2d5
INTASEND_PRIVATE_KEY=ISSecretKey_test_58429613-be22-4d5e-816d-d6fd827f216f
```

### Daraja/Safaricom (Alternative Payment)
```env
SAFARICOM_CONSUMER_KEY=uSXaNTq1PEjeplmS3bZW1itBXUUS9P8Y8OKarHTWxbtGwqVX
SAFARICOM_CONSUMER_SECRET=MYf1LhibvoPyP4c7oxtNc27h9MNno1xr61d732wjQcUyZzcJszC1ajhvqtpp2k82
DARAJA_SHORTCODE=60000
DARAJA_PASSKEY=QRilO35RprMK/vRFlM8YuEWlHeoaMdEvkKxobxWyctL3dNDSL...
DARAJA_CALLBACK_URL=https://462181ac9021.ngrok-free.app/daraja-callback
```

### Ngrok Tunnel
```env
NGROK_URL=https://d8b945761020.ngrok-free.app
```

---

## 💾 Database Schemas

### 1. Ticket Schema (index.js:31-40)
```javascript
{
  phoneNumber: String,      // User's phone number
  eventId: String,          // Event ID (E1-E5)
  eventName: String,        // Event name
  price: Number,            // Ticket price in KES
  ticketCode: String,       // 5-digit unique code
  status: String,           // Default: 'active'
  createdAt: Date           // Auto-generated timestamp
}
```

### 2. Transaction Schema (backend/models/Transaction.js)
```javascript
{
  merchantRequestId: String,
  checkoutRequestId: String,
  resultCode: Number,
  resultDesc: String,
  amount: Number,
  mpesaReceiptNumber: String,
  phoneNumber: String,
  transactionDate: String,   // Format: yyyymmddHHMMSS
  provider: String,          // 'daraja' or 'intasend'
  rawCallback: Object,       // Full payload for audit
  timestamps: true           // Auto createdAt/updatedAt
}
```

---

## 🎫 Event Catalog Data

### Events by Region

#### Nairobi (2 events)
```javascript
{
  id: 'E1',
  name: 'Nairobi Tech Fest',
  price: 250  // KES
},
{
  id: 'E2',
  name: 'City Concert',
  price: 350  // KES
}
```

#### Kiambu (1 event)
```javascript
{
  id: 'E3',
  name: 'Kiambu Expo',
  price: 150  // KES
}
```

#### Kisumu (1 event)
```javascript
{
  id: 'E4',
  name: 'Kisumu Music Night',
  price: 200  // KES
}
```

#### Mombasa (1 event)
```javascript
{
  id: 'E5',
  name: 'Mombasa Beach Party',
  price: 500  // KES
}
```

**Total Events:** 5  
**Price Range:** 150 - 500 KES

---

## 📱 USSD Menu Structure

### Main Menu (Level 0)
```
CON Welcome to AVARA
1. Buy Ticket
2. My Tickets
3. Wallet
4. Events Near Me
5. Support
0. Exit
```

### Menu 1: Buy Ticket
```
Level 1: Event selection (1-5)
Level 2: Payment confirmation
Level 3: M-Pesa STK push initiated
Result: Ticket code generated
```

### Menu 2: My Tickets
```
Displays all tickets for phone number:
- Event Name - Ticket Code
- Event Name - Ticket Code
```

### Menu 3: Wallet
```
1. Balance (shows 0 KES)
2. Deposit (Paybill 412345)
3. Withdraw (simulated)
```

### Menu 4: Events Near Me
```
1. Nairobi
2. Kiambu
3. Kisumu
4. Mombasa
Shows events in selected region
```

### Menu 5: Support
```
1. Request Call-Back
2. Report Issue
```

---

## 🔧 API Endpoints

### POST /ussd
**Purpose:** Handle USSD requests from Africa's Talking  
**Request Body:**
```javascript
{
  phoneNumber: String,  // User's phone number
  text: String          // USSD input path (e.g., "1*2*1")
}
```

**Response:** Text/plain USSD response (`CON` or `END`)

### GET /health
**Purpose:** Health check endpoint  
**Response:**
```json
{
  "status": "ok"
}
```

---

## 💳 Payment Flow

### IntaSend M-Pesa STK Push
```javascript
async function initiateStkPush(phoneNumber, amount, metadata) {
  const payload = {
    amount: Number,           // Ticket price
    phone_number: String,     // User's M-Pesa number
    narrative: "Event Ticket",
    api_ref: "ticket-{timestamp}",
    currency: "KES"
  };
  
  return await collection.mpesaStkPush(payload);
}
```

### Ticket Generation
```javascript
// Generate 5-digit ticket code
const ticketCode = Math.floor(10000 + Math.random() * 90000).toString();

// Save to MongoDB
await Ticket.create({
  phoneNumber,
  eventId,
  eventName,
  price,
  ticketCode
});
```

---

## 📦 Dependencies

```json
{
  "africastalking": "^0.7.4",      // USSD service provider
  "cors": "^2.8.5",                // Cross-origin resource sharing
  "dotenv": "^17.2.1",             // Environment variable management
  "express": "^5.1.0",             // Web framework
  "express-rate-limit": "^8.0.1",  // API rate limiting (60/min)
  "helmet": "^8.1.0",              // Security headers
  "intasend-node": "^1.1.2",       // M-Pesa integration
  "moment": "^2.30.1",             // Date/time handling
  "mongodb": "^6.19.0",            // MongoDB driver
  "mongoose": "^8.18.0",           // MongoDB ODM
  "nodemon": "^3.1.10"             // Development auto-reload
}
```

---

## 🚀 Running the Server

### Start Production Server
```bash
cd /home/junia-loves-juniour/code/event-vax/sms_AT
npm start
```

### Start Development Server
```bash
npm run dev  # Uses nodemon for auto-reload
```

### Server Output
```
✅ MongoDB connected
✅ Server ready on port 3000
```

---

## 🔐 Security Features

1. **Helmet.js** - HTTP security headers
2. **CORS** - Cross-origin resource sharing enabled
3. **Rate Limiting** - 60 requests per minute per IP
4. **Proxy Trust** - Behind ngrok/reverse proxy
5. **Environment Variables** - Sensitive data in .env

---

## 📊 Data Statistics

### Database Connection
- **Type:** MongoDB Atlas (Cloud)
- **Cluster:** cluster0.jyao82t.mongodb.net
- **Database:** event-vax
- **Collections:** 
  - `tickets` (defined in index.js)
  - `transactions` (defined in Transaction.js)

### Current Status
- ✅ Code deployed
- ✅ Dependencies installed
- ❌ Server not running (needs to be started)
- ⚠️ MongoDB requires active connection

---

## 🎯 User Journey Example

1. **User dials USSD:** `*384*12345#`
2. **Sees main menu:** Selects option 1 (Buy Ticket)
3. **Selects event:** Option 1 (Nairobi Tech Fest - 250 KES)
4. **Confirms payment:** Option 1 (Pay with M-Pesa)
5. **STK Push sent** to phone number
6. **User enters M-Pesa PIN** on phone
7. **Payment processed** via IntaSend
8. **Ticket generated:** Code `45231` saved to MongoDB
9. **User receives:** "Payment initiated. Your Ticket Code: 45231"
10. **User can view** ticket anytime via Menu 2

---

## 📈 Potential Data Queries

### Get all tickets for a user
```javascript
const tickets = await Ticket.find({ phoneNumber: "254712345678" });
```

### Get tickets for specific event
```javascript
const tickets = await Ticket.find({ eventId: "E1" });
```

### Get total revenue for an event
```javascript
const result = await Ticket.aggregate([
  { $match: { eventId: "E1" } },
  { $group: { _id: null, total: { $sum: "$price" } } }
]);
```

### Get transactions by date range
```javascript
const transactions = await Transaction.find({
  createdAt: { 
    $gte: new Date("2026-01-01"),
    $lte: new Date("2026-01-31")
  }
});
```

---

## 🔄 Integration Points

1. **Africa's Talking** → USSD callback to `/ussd`
2. **IntaSend** → M-Pesa STK push
3. **MongoDB Atlas** → Ticket & transaction storage
4. **Ngrok** → Public URL for callbacks (dev)

---

## 📝 Notes

- System uses **sandbox mode** for testing
- Ticket codes are **5-digit random numbers**
- Phone numbers stored with **country code**
- All prices in **Kenyan Shillings (KES)**
- USSD responses use `CON` (continue) or `END` (terminate)

---

## ✅ Next Steps to Access Live Data

1. **Start the server:**
   ```bash
   cd /home/junia-loves-juniour/code/event-vax/sms_AT
   npm run dev
   ```

2. **Expose via ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Configure Africa's Talking:**
   - Set callback URL to ngrok URL + `/ussd`

4. **Query MongoDB:**
   ```bash
   mongosh "mongodb+srv://cluster0.jyao82t.mongodb.net/" --username mokayaj857_db_user
   ```

5. **View tickets:**
   ```javascript
   use event-vax
   db.tickets.find().pretty()
   ```

---

**Generated:** 2026-01-25T17:51:58Z  
**System:** AVARA USSD Ticketing Platform

