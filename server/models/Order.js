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
    required: true,
    default: 0,
    min: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  ready_at: Date,
  delivered_at: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hook to calculate total amount
OrderSchema.pre('save', function(next) {
  // Calculate total amount only if items have changed or total_amount is not set
  if (this.isModified('items') || this.total_amount === 0) {
    this.total_amount = this.items.reduce((total, item) => 
      total + (item.quantity * item.item_price), 0);
  }
  
  // Ensure delivered_at is set when status becomes 'delivered'
  if (this.isModified('status') && this.status === 'delivered' && !this.delivered_at) {
    this.delivered_at = new Date();
  }
  
  next();
});

// Index for efficient querying
OrderSchema.index({ 
  status: 1, 
  delivered_at: -1, 
  createdAt: -1 
});

module.exports = mongoose.model('Order', OrderSchema);