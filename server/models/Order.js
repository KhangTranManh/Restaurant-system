const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  menu_item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  },
  menu_item_id: Number, // For backward compatibility
  menu_item_name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  item_price: {
    type: Number,
    required: true
  },
  special_instructions: {
    type: String,
    default: ''
  }
});

const OrderSchema = new mongoose.Schema({
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  table_number: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  items: [OrderItemSchema],
  total_amount: {
    type: Number,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  ready_at: Date,
  delivered_at: Date
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);