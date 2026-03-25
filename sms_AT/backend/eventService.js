const axios = require('axios');

// Server API base URL - update this if your server runs on different host/port
const SERVER_API_URL = process.env.SERVER_API_URL || 'http://localhost:8080/api';

/**
 * Fetch all events from the server
 */
async function fetchAllEvents() {
  try {
    const response = await axios.get(`${SERVER_API_URL}/events`);
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching events from server:', error.message);
    return [];
  }
}

/**
 * Fetch single event by ID
 */
async function fetchEventById(eventId) {
  try {
    const response = await axios.get(`${SERVER_API_URL}/events/${eventId}`);
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error.message);
    return null;
  }
}

/**
 * Format events for USSD menu display
 * Groups events by venue/location
 */
async function getEventsGroupedByVenue() {
  const events = await fetchAllEvents();
  const grouped = {};

  events.forEach((event) => {
    const venue = event.venue || 'Other';
    if (!grouped[venue]) {
      grouped[venue] = [];
    }
    grouped[venue].push({
      id: event.id,
      name: event.event_name,
      price: parseFloat(event.regular_price) || 500, // Default price if not set
      date: event.event_date,
      vipPrice: parseFloat(event.vip_price) || null,
      vvipPrice: parseFloat(event.vvip_price) || null,
    });
  });

  return grouped;
}

/**
 * Get flattened event list for USSD menu (numbered list)
 */
async function getEventsList() {
  const events = await fetchAllEvents();
  return events.map((event) => ({
    id: event.id,
    name: event.event_name,
    price: parseFloat(event.regular_price) || 500, // Default price if not set
    venue: event.venue,
    date: event.event_date,
    vipPrice: parseFloat(event.vip_price) || null,
    vvipPrice: parseFloat(event.vvip_price) || null,
  }));
}

/**
 * Create event ID to array index map for USSD navigation
 */
async function getEventMap() {
  const events = await getEventsList();
  const eventMap = {};
  
  events.forEach((event, index) => {
    eventMap[(index + 1).toString()] = event;
  });
  
  return eventMap;
}

module.exports = {
  fetchAllEvents,
  fetchEventById,
  getEventsGroupedByVenue,
  getEventsList,
  getEventMap,
};
