import express from 'express';
import { handleChatbotQuery } from '../utils/chatHandler.js';

const router = express.Router();

/**
 * POST /api/chatbot
 * Handles chatbot queries and returns appropriate responses
 */
router.post('/', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Process the message and get response
    const response = await handleChatbotQuery(message, userId);
    
    // Return the response
    return res.json({ response });
  } catch (error) {
    console.error('Error processing chatbot query:', error);
    return res.status(500).json({ error: 'Failed to process your request' });
  }
});

/**
 * GET /api/chatbot/health
 * Chatbot specific health check
 */
router.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'EventVax Chatbot' });
});

export default router;
