import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chatbotRouter from './routes/chatbot.js';
import eventsRouter from './routes/events.js';
import ticketsRouter from './routes/tickets.js';
import metadataRouter from './routes/metadata.js';
import poapRouter from './routes/poap.js';
import verificationRouter from './routes/verification.js';
import { initDatabase } from './utils/database.js';
import { syncEventsFromBlockchain } from './utils/snowtraceSync.js';
import PoapRelayer from './utils/poapRelayer.js';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize express app
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for image data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database
try {
  initDatabase();
  syncEventsFromBlockchain().catch(err => console.error('Blockchain sync error:', err.message));
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Routes
app.use('/api/chatbot', chatbotRouter);
app.use('/api/events', eventsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/metadata', metadataRouter);
app.use('/api/poap', poapRouter);
app.use('/api/verification', verificationRouter);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'EventVax API is running' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chatbot API: http://localhost:${PORT}/api/chatbot`);
  console.log(`🎫 Events API: http://localhost:${PORT}/api/events`);
  console.log(`🎟️  Tickets API: http://localhost:${PORT}/api/tickets`);
  console.log(`🔗 Metadata API (POAP/Badge): http://localhost:${PORT}/api/metadata`);
  console.log(`🏆 POAP API: http://localhost:${PORT}/api/poap`);
  console.log(`✅ Verification API: http://localhost:${PORT}/api/verification`);
  
  const relayer = new PoapRelayer();
  relayer.start();
});