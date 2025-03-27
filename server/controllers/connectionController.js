// controllers/connectionController.js
const ConnectionLog = require('../models/ConnectionLog');

// Get all connection logs
exports.getLogs = async (req, res) => {
  try {
    // Set a default limit to prevent returning too many records
    const limit = parseInt(req.query.limit) || 100;
    
    // Get logs sorted by timestamp (newest first)
    const logs = await ConnectionLog.find()
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching connection logs:', error);
    res.status(500).json({ message: 'Error fetching connection logs' });
  }
};

// Get connection statistics
exports.getStats = async (req, res) => {
  try {
    // Get current time minus 5 minutes (for active connections)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Find the most recent log entry for each clientId to determine if they're connected
    const activeClients = await ConnectionLog.aggregate([
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$clientId",
          lastType: { $first: "$type" },
          lastRoom: { $first: "$room" },
          lastTimestamp: { $first: "$timestamp" }
        }
      },
      {
        $match: {
          lastType: { $ne: "disconnect" },
          lastTimestamp: { $gte: fiveMinutesAgo }
        }
      }
    ]);
    
    // Count clients by room
    let adminCount = 0;
    let staffCount = 0;
    let kitchenCount = 0;
    
    activeClients.forEach(client => {
      if (client.lastRoom === 'admin') adminCount++;
      if (client.lastRoom === 'staff') staffCount++;
      if (client.lastRoom === 'kitchen') kitchenCount++;
    });
    
    res.json({
      total: activeClients.length,
      admin: adminCount,
      staff: staffCount,
      kitchen: kitchenCount
    });
  } catch (error) {
    console.error('Error getting connection stats:', error);
    res.status(500).json({ message: 'Error getting connection stats' });
  }
};

// Create a new connection log
exports.createLog = async (req, res) => {
  try {
    const { clientId, type, room } = req.body;
    
    // Validate required fields
    if (!clientId || !type) {
      return res.status(400).json({ message: 'ClientId and type are required' });
    }
    
    // If type is join, room is required
    if (type === 'join' && !room) {
      return res.status(400).json({ message: 'Room is required for join events' });
    }
    
    // Create the log
    const log = new ConnectionLog({
      clientId,
      type,
      room,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    await log.save();
    
    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating connection log:', error);
    res.status(500).json({ message: 'Error creating connection log' });
  }
};

// Delete old logs (maintenance method)
exports.deleteLogs = async (req, res) => {
  try {
    const { olderThan } = req.query;
    
    if (!olderThan) {
      return res.status(400).json({ message: 'olderThan parameter is required' });
    }
    
    const date = new Date(parseInt(olderThan));
    
    const result = await ConnectionLog.deleteMany({ timestamp: { $lt: date } });
    
    res.json({
      message: `Deleted ${result.deletedCount} connection logs older than ${date.toISOString()}`
    });
  } catch (error) {
    console.error('Error deleting connection logs:', error);
    res.status(500).json({ message: 'Error deleting connection logs' });
  }
};