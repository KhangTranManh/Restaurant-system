const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const mongoose = require('mongoose');


router.get('/', tableController.getTables);
router.get('/:table_id', tableController.getTable);
router.put('/:table_id/status', tableController.updateTableStatus);
// Add this route to your table routes
router.get('/stats', tableController.getTableStats);

// In server/routes/tables.js
router.get('/stats', async (req, res) => {
    try {
      const availableCount = await Table.countDocuments({ status: 'available' });
      const occupiedCount = await Table.countDocuments({ status: 'occupied' });
      
      res.json({
        available: availableCount,
        occupied: occupiedCount,
        total: availableCount + occupiedCount
      });
    } catch (error) {
      console.error('Error getting table stats:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

module.exports = router;