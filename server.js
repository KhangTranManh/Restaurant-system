const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./server/config/db');
const socketConfig = require('./server/config/socket');

require('dotenv').config();

// Import routes
const authRoutes = require('./server/routes/auth');
const menuRoutes = require('./server/routes/menu');
const tableRoutes = require('./server/routes/tables');
const orderRoutes = require('./server/routes/orders');
const userRoutes = require('./server/routes/users');
const settingsRoutes = require('./server/routes/settings');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO using the configuration
const io = socketConfig.init(server);

// Middleware to make io available in request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Don't export io directly - use the socket config module
module.exports = app;