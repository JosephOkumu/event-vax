import express from 'express';
import { insertEvent, getAllEvents, getEventById, updateEvent, deleteEvent, getEventsByCreator, insertComment, getCommentsByEvent, insertRating, getRatingsByEvent } from '../utils/database.js';

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
// Add comment to event
router.post('/:id/comments', async (req, res) => {
    try {
        const { userName, userWallet, comment, verified } = req.body;
        if (!comment) {
            return res.status(400).json({ success: false, error: 'Comment is required' });
        }

        const commentId = insertComment({
            eventId: req.params.id,
            userName,
            userWallet,
            comment,
            verified
        });

        res.status(201).json({ success: true, message: 'Comment added', commentId });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ success: false, error: 'Failed to add comment', details: error.message });
    }
});

// Get comments for event
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = getCommentsByEvent(req.params.id);
        const formatted = comments.map(c => ({
            id: c.id,
            userName: c.user_name,
            userWallet: c.user_wallet,
            comment: c.comment,
            createdAt: c.created_at,
            verified: Boolean(c.verified)
        }));
        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch comments', details: error.message });
    }
});

// Add rating to event
router.post('/:id/ratings', async (req, res) => {
    try {
        const { userName, userWallet, rating } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: 'Valid rating (1-5) is required' });
        }

        const ratingId = insertRating({
            eventId: req.params.id,
            userName,
            userWallet,
            rating
        });

        res.status(201).json({ success: true, message: 'Rating added', ratingId });
    } catch (error) {
        console.error('Error adding rating:', error);
        res.status(500).json({ success: false, error: 'Failed to add rating', details: error.message });
    }
});

// Get ratings for event
router.get('/:id/ratings', async (req, res) => {
    try {
        const ratings = getRatingsByEvent(req.params.id);
        const formatted = ratings.map(r => ({
            id: r.id,
            userName: r.user_name,
            userWallet: r.user_wallet,
            rating: r.rating,
            createdAt: r.created_at
        }));
        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch ratings', details: error.message });
    }
});

export default router;
