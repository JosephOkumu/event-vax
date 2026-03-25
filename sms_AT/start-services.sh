#!/bin/bash

# Startup script for EventVax USSD + Server Integration

echo "🚀 Starting EventVax Services..."
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if MongoDB is running
echo -e "\n${YELLOW}Checking MongoDB...${NC}"
if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo -e "${RED}❌ MongoDB is not running${NC}"
    echo "Start MongoDB with: sudo systemctl start mongod"
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check if port 8080 is available
if check_port 8080; then
    echo -e "${YELLOW}⚠️  Port 8080 is already in use${NC}"
    echo "Kill the process or use a different port"
fi

# Check if port 3000 is available
if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo "Kill the process or use a different port"
fi

echo -e "\n${YELLOW}Starting services in separate terminals...${NC}"
echo "You can also start them manually:"
echo ""
echo "Terminal 1 (Event Server):"
echo "  cd ~/code/joe/event-vax/server && npm start"
echo ""
echo "Terminal 2 (USSD Service):"
echo "  cd ~/code/joe/event-vax/sms_AT && npm start"
echo ""
echo -e "${GREEN}Press Ctrl+C to exit${NC}"
