const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();
const { Server } = require('socket.io');
const app = require('./app');

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Set io on app to be accessible in routes
app.set('io', io);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Socket.io configuration
require('./socket/socket')(io);

// Initialize background workers
const initMessageScheduler = require('./workers/messageScheduler');
initMessageScheduler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
