#!/usr/bin/env node

/**
 * Test script to verify SMS USSD integration with Event Server
 */

const axios = require('axios');
const { getEventsList, getEventMap } = require('./backend/eventService');

const SERVER_URL = process.env.SERVER_API_URL || 'http://localhost:8080/api';

async function testIntegration() {
  console.log('🧪 Testing SMS USSD ↔️ Event Server Integration\n');
  console.log('=' .repeat(60));

  // Test 1: Server Health Check
  console.log('\n📡 Test 1: Server Health Check');
  try {
    const response = await axios.get('http://localhost:8080/health');
    console.log('✅ Server is running:', response.data);
  } catch (error) {
    console.log('❌ Server is not running. Start it with:');
    console.log('   cd ~/code/joe/event-vax/server && npm start');
    return;
  }

  // Test 2: Fetch Events from Server
  console.log('\n📡 Test 2: Fetching Events from Server API');
  try {
    const response = await axios.get(`${SERVER_URL}/events`);
    console.log(`✅ Fetched ${response.data.count} events from server`);
    
    if (response.data.count === 0) {
      console.log('⚠️  No events found in database');
      console.log('   Add events via the EventVax frontend or API');
    } else {
      console.log('\nSample events:');
      response.data.data.slice(0, 3).forEach((event, i) => {
        console.log(`  ${i + 1}. ${event.event_name} - ${event.venue} (${event.regular_price} KES)`);
      });
    }
  } catch (error) {
    console.log('❌ Failed to fetch events:', error.message);
    return;
  }

  // Test 3: Event Service Functions
  console.log('\n📡 Test 3: Testing Event Service Functions');
  try {
    const eventsList = await getEventsList();
    console.log(`✅ getEventsList() returned ${eventsList.length} events`);

    const eventMap = await getEventMap();
    const mapKeys = Object.keys(eventMap);
    console.log(`✅ getEventMap() created ${mapKeys.length} mappings`);

    if (mapKeys.length > 0) {
      console.log('\nUSSD Menu Mapping:');
      mapKeys.slice(0, 3).forEach((key) => {
        const event = eventMap[key];
        console.log(`  Option ${key}: ${event.name} (${event.price} KES)`);
      });
    }
  } catch (error) {
    console.log('❌ Event service error:', error.message);
    return;
  }

  // Test 4: USSD Service Health
  console.log('\n📡 Test 4: USSD Service Health Check');
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('✅ USSD service is running:', response.data);
  } catch (error) {
    console.log('⚠️  USSD service not running (this is expected if not started)');
    console.log('   Start it with: npm start');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Integration tests completed!\n');
  console.log('📝 Next Steps:');
  console.log('   1. Ensure both services are running');
  console.log('   2. Add test events via the EventVax API/frontend');
  console.log('   3. Test USSD flow by dialing your USSD code');
}

// Run tests
testIntegration().catch((error) => {
  console.error('Test failed:', error.message);
  process.exit(1);
});
