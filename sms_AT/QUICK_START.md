# Quick Start Guide - USSD + Server Integration

## 🎯 Quick Commands

### Start Services (in separate terminals)

```bash
# Terminal 1 - Event Server
cd ~/code/joe/event-vax/server && npm start

# Terminal 2 - USSD Service  
cd ~/code/joe/event-vax/sms_AT && npm start
```

### Test Integration

```bash
cd ~/code/joe/event-vax/sms_AT
node test-integration.js
```

### Check Health

```bash
# Server
curl http://localhost:8080/health

# USSD
curl http://localhost:3000/health

# Get Events
curl http://localhost:8080/api/events
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `backend/eventService.js` | Fetches events from server API |
| `index.js` | Main USSD application |
| `.env` | Configuration (includes SERVER_API_URL) |
| `INTEGRATION_GUIDE.md` | Detailed setup & documentation |
| `INTEGRATION_SUMMARY.md` | What was changed |
| `test-integration.js` | Integration test script |

## 🔄 How It Works

1. User dials USSD code
2. USSD calls `getEventsList()` from eventService
3. eventService fetches from `http://localhost:8080/api/events`
4. Server returns events from SQLite database
5. USSD displays events to user
6. User selects event → M-Pesa payment
7. Ticket saved to MongoDB

## ✅ Checklist

- [ ] MongoDB running (`sudo systemctl start mongod`)
- [ ] Server started on port 8080
- [ ] USSD service started on port 3000
- [ ] SERVER_API_URL configured in .env
- [ ] Test events added to database

## 🆘 Quick Fixes

**No events showing?**
```bash
# Check if events exist
curl http://localhost:8080/api/events

# Add test event via API
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Test Event",
    "eventDate": "2026-02-15",
    "venue": "Nairobi",
    "regularPrice": "500",
    "description": "Test event"
  }'
```

**Connection errors?**
```bash
# Restart both services
# Kill existing processes
pkill -f "node.*server.js"
pkill -f "node.*index.js"

# Start fresh
cd ~/code/joe/event-vax/server && npm start &
cd ~/code/joe/event-vax/sms_AT && npm start
```

## 📚 Full Documentation

- See `INTEGRATION_GUIDE.md` for complete setup
- See `INTEGRATION_SUMMARY.md` for technical details
- See `SMS_AT_DATA_OVERVIEW.md` for data flow

---
**Ready to use!** 🚀
