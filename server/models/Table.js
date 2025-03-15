const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  table_number: {
    type: Number,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved'],
    default: 'available'
  },
  capacity: {
    type: Number,
    required: true,
    default: 4
  },
  current_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }
}, { timestamps: true });

module.exports = mongoose.model('Table', TableSchema);