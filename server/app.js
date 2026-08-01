// NOTE: dotenv is loaded in server.js before this module is imported.
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import databaseRoutes from './routes/databaseRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// Initialize MongoDB database (connects and seeds default accounts if empty)
import './config/database.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/databases', databaseRoutes);
app.use('/api/chat', chatRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

export default app;
