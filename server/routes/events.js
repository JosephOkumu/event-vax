import express from 'express';
import { insertEvent, getAllEvents, getEventById, updateEvent, deleteEvent, getEventsByCreator } from '../utils/database.js';

const router = express.Router();

// Create new event (NO IPFS - database only)
router.post('/', async (req, res) => {
    try {
        const eventData = req.body;

        // Validate required fields
        if (!eventData.eventName || !eventData.eventDate || !eventData.venue) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: eventName, eventDate, venue'
            });
        }

        console.log('💾 Saving event to database (no IPFS for event posters)...');

        // Save directly to database with base64 image
        const eventId = insertEvent(eventData);

        const savedEvent = getEventById(eventId);

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            eventId: eventId,
            data: savedEvent
        });
    } catch (error) {
        console.error('❌ Error creating event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create event',
            details: error.message
        });
    }
});

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = getAllEvents();
        res.json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch events',
            details: error.message
        });
    }
});

// Get events by creator wallet address
router.get('/creator/:walletAddress', async (req, res) => {
    try {
        const events = getEventsByCreator(req.params.walletAddress);
        res.json({
            success: true,
            count: events.length,
            events: events
        });
    } catch (error) {
        console.error('Error fetching creator events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch creator events',
            details: error.message
        });
    }
});

// Get event by ID
router.get('/:id', async (req, res) => {
    try {
        const event = getEventById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        // Always add POAP fields for frontend compatibility
        // Use base64 fallback if IPFS hash exists but might not be accessible
        event.poap_image_url = event.poap_image_base64 || 
            (event.poap_ipfs_hash ? `https://gateway.pinata.cloud/ipfs/${event.poap_ipfs_hash}` : null);
        event.poap_expiry_date = event.poap_expiry;
        
        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch event',
            details: error.message
        });
    }
});

// Update event
router.put('/:id', async (req, res) => {
    try {
        const eventData = req.body;
        const changes = updateEvent(req.params.id, eventData);

        if (changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        res.json({
            success: true,
            message: 'Event updated successfully',
            data: getEventById(req.params.id)
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update event',
            details: error.message
        });
    }
});

// Delete event
router.delete('/:id', async (req, res) => {
    try {
        const changes = deleteEvent(req.params.id);

        if (changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete event',
            details: error.message
        });
    }
});

// Store POAP metadata for event
router.post('/poap', async (req, res) => {
    const { eventId, ipfsHash, contentHash, expiryDate, supplyType, supplyCount, imageBase64 } = req.body;
    
    try {
        const { updateEventPoap } = await import('../utils/database.js');
        const changes = updateEventPoap(eventId, {
            ipfsHash,
            contentHash,
            expiryDate,
            supplyType,
            supplyCount,
            imageBase64
        });
        
        if (changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }
        
        console.log(`✅ POAP data updated for event ${eventId}`);
        res.json({ success: true, message: 'POAP data saved successfully' });
    } catch (error) {
        console.error('❌ Error saving POAP:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
