const axios = require('axios');
const { getAvaxKesRate } = require('./avaxToKes.cjs');

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

// Helper: convert AVAX → KES using a pre-fetched rate (synchronous after fetch)
function toKes(avax, rate) {
  const kes = parseFloat(avax || 0) * rate;
  return kes >= 1 ? Math.round(kes) : parseFloat(kes.toFixed(2));
}

/**
 * Format events grouped by venue — prices in KES.
 */
async function getEventsGroupedByVenue() {
  const [events, rate] = await Promise.all([fetchAllEvents(), getAvaxKesRate()]);
  const grouped = {};

  for (const event of events) {
    const venue = event.venue || 'Other';
    if (!grouped[venue]) grouped[venue] = [];
    grouped[venue].push({
      id: event.id,
      name: event.event_name,
      price: toKes(event.regular_price, rate),
      date: event.event_date,
      vipPrice: event.vip_price ? toKes(event.vip_price, rate) : null,
      vvipPrice: event.vvip_price ? toKes(event.vvip_price, rate) : null,
    });
  }

  return grouped;
}

/**
 * Flat event list for USSD numbered menu — prices in KES.
 */
async function getEventsList() {
  const [events, rate] = await Promise.all([fetchAllEvents(), getAvaxKesRate()]);

  return events.map(event => ({
    id: event.id,
    name: event.event_name,
    price: toKes(event.regular_price, rate),
    priceAvax: parseFloat(event.regular_price) || 0,
    venue: event.venue,
    date: event.event_date,
    vipPrice: event.vip_price ? toKes(event.vip_price, rate) : null,
    vvipPrice: event.vvip_price ? toKes(event.vvip_price, rate) : null,
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
