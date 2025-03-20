// server/config/socket.js
const socketIO = require('socket.io');

let io = null;

module.exports = {
  init: (server) => {
    if (io) {
      return io; // Return existing instance if already initialized
    }
    
    io = socketIO(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
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
      
      // Generic join room functionality
      socket.on('join', (data) => {
        const role = data.role || 'customer';
        socket.join(role);
        console.log(`Client joined ${role} room`);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
    
    return io;
  },
  
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};