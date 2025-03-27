// server/routes/connections.js
const express = require('express');
const router = express.Router();
const ConnectionLog = require('../models/ConnectionLog');

// Import auth middleware with the correct path - adjust this path to match your project
const { authenticateUser, isAdmin } = require('../middleware/auth'); 
// Or if your auth middleware is elsewhere, use the correct path:
// const { authenticateUser, isAdmin } = require('../config/auth');

// Get connection logs - admin only
router.get('/logs', async (req, res) => {
  try {
    // Default limit to 100 records
    const limit = parseInt(req.query.limit) || 100;
    
    const logs = await ConnectionLog.find()
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching connection logs:', error);
    res.status(500).json({ message: 'Error fetching connection logs' });
  }
});

// Get connection statistics
router.get('/stats', async (req, res) => {
  try {
    // Get active connections in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Find the most recent log entry for each clientId
    const recentActivities = await ConnectionLog.aggregate([
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
    
    recentActivities.forEach(client => {
      // Check the last known room for this client
      if (client.lastRoom === 'admin') adminCount++;
      else if (client.lastRoom === 'staff') staffCount++;
      else if (client.lastRoom === 'kitchen') kitchenCount++;
    });
    
    res.json({
      total: recentActivities.length,
      admin: adminCount,
      staff: staffCount,
      kitchen: kitchenCount
    });
  } catch (error) {
    console.error('Error getting connection stats:', error);
    res.status(500).json({ message: 'Error getting connection stats' });
  }
});

// Delete old logs
router.delete('/logs', async (req, res) => {
  try {
    const { olderThan } = req.query;
    
    if (!olderThan) {
      return res.status(400).json({ message: 'olderThan parameter is required (timestamp in ms)' });
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
});

module.exports = router;