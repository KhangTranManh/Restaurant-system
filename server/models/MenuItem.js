const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuCategory',
    required: true
  },
  category_id: Number, // For backward compatibility
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image_path: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  preparation_time: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', MenuItemSchema);