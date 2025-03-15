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

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketConfig.init(server);

// Make io available in the request object for controllers to use
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

// Set up WebSocket event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join kitchen room for kitchen staff
  socket.on('joinKitchen', () => {
    socket.join('kitchen');
    console.log(`${socket.id} joined kitchen room`);
  });
  
  // Join staff room for waitstaff
  socket.on('joinStaff', () => {
    socket.join('staff');
    console.log(`${socket.id} joined staff room`);
  });
  
  // Join customer room for specific table
  socket.on('joinTable', (tableNumber) => {
    socket.join(`table-${tableNumber}`);
    console.log(`${socket.id} joined table-${tableNumber} room`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});