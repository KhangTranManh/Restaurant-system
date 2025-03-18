// models/Settings.js - Updated with color settings
const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  restaurantName: {
    type: String,
    default: "Viet Nam Cuisine"
  },
  contactNumber: {
    type: String,
    default: "(+84) 123 456 789"
  },
  email: {
    type: String,
    default: "info@vietnamcuisine.com"
  },
  taxRate: {
    type: Number,
    default: 10
  },
  tableCount: {
    type: Number,
    default: 8
  },
  reservedTables: {
    type: [Number],
    default: [5]
  },
  // Add color settings
  primaryColor: {
    type: String,
    default: "#B32821" // Default red color
  },
  secondaryColor: {
    type: String,
    default: "#4B6F44" // Default green color
  }
}, { timestamps: true });

module.exports = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);