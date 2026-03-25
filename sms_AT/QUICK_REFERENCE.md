# USSD Quick Reference Card 📱

## 🚀 Starting Services

```bash
# Terminal 1 - EventVax Server
cd ~/code/joe/event-vax/server
npm start

# Terminal 2 - USSD Service  
cd ~/code/joe/event-vax/sms_AT
npm start
```

## 🧪 Running Tests

```bash
# Quick test
cd ~/code/joe/event-vax/sms_AT
bash test-ussd-complete.sh

# Manual test
curl -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "254712345678", "text": ""}'
```

## 📊 Health Checks

```bash
# Server health
curl http://localhost:8080/health

# USSD health
curl http://localhost:3000/health

# Check events
curl http://localhost:8080/api/events | jq '.count'
```

## 🎯 USSD Menu Structure

```
Main Menu (text="")
├── 1. Buy Ticket
│   ├── Select Event (text="1")
│   ├── Event Details (text="1*1")  
│   ├── Pay M-Pesa (text="1*1*1") → END
│   ├── Cancel (text="1*1*0") → END
│   └── Back (text="1*0") → Main Menu
│
├── 2. My Tickets (text="2") → END
│
├── 3. Wallet
│   ├── Menu (text="3")
│   ├── Balance (text="3*1") → END
│   ├── Deposit (text="3*2") → END
│   ├── Withdraw (text="3*3") → END
│   └── Back (text="3*0") → Main Menu
│
├── 4. Events Near Me
│   ├── Venues (text="4")
│   ├── Select Venue (text="4*1") → END
│   └── Back (text="4*0") → Main Menu
│
├── 5. Support
│   ├── Menu (text="5")
│   ├── Callback (text="5*1") → END
│   ├── Report (text="5*2") → END
│   └── Back (text="5*0") → Main Menu
│
└── 0. Exit (text="0") → END
```

## ✅ Testing Checklist

- [ ] Services running (8080, 3000)
- [ ] MongoDB connected
- [ ] Events loading from server
- [ ] All menus display correctly
- [ ] Back navigation works
- [ ] END messages on exit
- [ ] Prices showing correctly
- [ ] Error handling works

## 🐛 Troubleshooting

**No events showing?**
```bash
curl http://localhost:8080/api/events
```

**Multiple processes running?**
```bash
ps aux | grep "node.*index.js"
kill <PID>
```

**Connection refused?**
```bash
# Check if services are running
netstat -tlnp | grep -E "(3000|8080)"
```

**MongoDB issues?**
```bash
sudo systemctl status mongod
sudo systemctl start mongod
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `index.js` | Main USSD application |
| `backend/eventService.js` | Fetches events from server |
| `test-ussd-complete.sh` | Comprehensive test suite |
| `TEST_REPORT.md` | Detailed test results |
| `.env` | Configuration (SERVER_API_URL) |

## 🔐 Environment Variables

```env
# Required
MONGODB_URI=mongodb://127.0.0.1:27017/event-vax
SERVER_API_URL=http://localhost:8080/api
PORT=3000

# M-Pesa (IntaSend)
INTASEND_PUBLIC_KEY=ISPubKey_test_...
INTASEND_PRIVATE_KEY=ISSecretKey_test_...
INTASEND_ENV=test
```

## 📞 Test Numbers Format

- Kenya: `254XXXXXXXXX`
- Example: `254712345678`

## ⚡ Quick Commands

```bash
# Restart USSD
cd ~/code/joe/event-vax/sms_AT
kill $(cat /tmp/ussd.pid)
npm start

# View logs
tail -f /tmp/ussd_production.log

# Test specific flow
curl -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "254712345678", "text": "1"}'
```

## ✨ Success Indicators

✅ All 24 tests passing  
✅ Response starts with CON or END  
✅ Events loaded from server  
✅ Back navigation returns to menus  
✅ Exit shows END message  

---

**Status:** ✅ Production Ready  
**Last Tested:** 2026-01-25  
**Test Success Rate:** 100% (24/24)
