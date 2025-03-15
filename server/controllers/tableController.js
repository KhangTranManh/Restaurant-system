const Table = require('../models/Table');
const { io } = require('../config/socket');

// Get all tables
exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ table_number: 1 });
    res.json(tables);
  } catch (error) {
    console.error('Error getting tables:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific table
exports.getTable = async (req, res) => {
  try {
    const tableId = req.params.table_id;
    
    const table = await Table.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(tableId) ? tableId : null },
        { table_number: parseInt(tableId) || 0 }
      ]
    });
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    res.json(table);
  } catch (error) {
    console.error('Error getting table:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update table status
exports.updateTableStatus = async (req, res) => {
  try {
    const tableId = req.params.table_id;
    const { status } = req.body;
    
    if (!['available', 'occupied', 'reserved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const table = await Table.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(tableId) ? tableId : null },
        { table_number: parseInt(tableId) || 0 }
      ]
    });
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Update table status
    table.status = status;
    
    // Handle current order ID
    if (status === 'occupied') {
      if (req.body.order_id) {
        table.current_order_id = req.body.order_id;
      }
    } else if (status === 'available') {
      table.current_order_id = null;
    }
    
    await table.save();
    
    // Notify clients via Socket.IO
    io.emit('tableStatusChanged', {
      tableId: table._id,
      tableNumber: table.table_number,
      status: table.status
    });
    
    res.json(table);
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};