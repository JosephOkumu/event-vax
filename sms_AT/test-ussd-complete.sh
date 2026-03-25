#!/bin/bash

# Comprehensive USSD Test Report Generator
# Tests all USSD flows and generates a detailed report

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

test_ussd() {
  local test_name="$1"
  local phone="$2"
  local text="$3"
  local expected_start="$4"  # CON or END
  
  response=$(curl -s -X POST http://localhost:3000/ussd \
    -H "Content-Type: application/json" \
    -d "{\"phoneNumber\": \"$phone\", \"text\": \"$text\"}")
  
  # Check if response starts with expected prefix
  if echo "$response" | grep -q "^$expected_start"; then
    echo -e "${GREEN}✅ PASS${NC} - $test_name"
    ((PASS++))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC} - $test_name"
    echo "   Expected: Starts with '$expected_start'"
    echo "   Got: ${response:0:50}..."
    ((FAIL++))
    return 1
  fi
}

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     USSD INTEGRATION TEST REPORT                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}📱 MAIN MENU TESTS${NC}"
test_ussd "1. Initial Menu Display" "254712345678" "" "CON"
test_ussd "2. Exit Application" "254712345678" "0" "END"
test_ussd "3. Invalid Menu Option" "254712345678" "99" "END"
echo ""

echo -e "${YELLOW}🎫 BUY TICKET FLOW${NC}"
test_ussd "4. Show Events List" "254712345678" "1" "CON"
test_ussd "5. Select Event" "254712345678" "1*1" "CON"
test_ussd "6. Cancel Payment" "254712345678" "1*1*0" "END"
test_ussd "7. Back from Events" "254712345678" "1*0" "CON"
test_ussd "8. Invalid Event Selection" "254712345678" "1*999" "END"
echo ""

echo -e "${YELLOW}🎟️  MY TICKETS${NC}"
test_ussd "9. View My Tickets (Empty)" "254712345678" "2" "END"
echo ""

echo -e "${YELLOW}💰 WALLET TESTS${NC}"
test_ussd "10. Wallet Menu" "254712345678" "3" "CON"
test_ussd "11. Check Balance" "254712345678" "3*1" "END"
test_ussd "12. Deposit Instructions" "254712345678" "3*2" "END"
test_ussd "13. Withdraw" "254712345678" "3*3" "END"
test_ussd "14. Back from Wallet" "254712345678" "3*0" "CON"
test_ussd "15. Invalid Wallet Option" "254712345678" "3*99" "END"
echo ""

echo -e "${YELLOW}📍 EVENTS NEAR ME${NC}"
test_ussd "16. Show Venues List" "254712345678" "4" "CON"
test_ussd "17. Select Venue" "254712345678" "4*1" "END"
test_ussd "18. Back from Venues" "254712345678" "4*0" "CON"
test_ussd "19. Invalid Venue" "254712345678" "4*999" "END"
echo ""

echo -e "${YELLOW}🆘 SUPPORT TESTS${NC}"
test_ussd "20. Support Menu" "254712345678" "5" "CON"
test_ussd "21. Request Callback" "254712345678" "5*1" "END"
test_ussd "22. Report Issue" "254712345678" "5*2" "END"
test_ussd "23. Back from Support" "254712345678" "5*0" "CON"
test_ussd "24. Invalid Support Option" "254712345678" "5*99" "END"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
TOTAL=$((PASS + FAIL))
echo -e "${BLUE}📊 Total Tests: $TOTAL${NC}"

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}"
  echo "╔════════════════════════════════════════════╗"
  echo "║  🎉 ALL TESTS PASSED! USSD IS WORKING!   ║"
  echo "╚════════════════════════════════════════════╝"
  echo -e "${NC}"
  exit 0
else
  echo -e "${RED}"
  echo "╔════════════════════════════════════════════╗"
  echo "║  ⚠️  SOME TESTS FAILED - CHECK ABOVE      ║"
  echo "╚════════════════════════════════════════════╝"
  echo -e "${NC}"
  exit 1
fi
