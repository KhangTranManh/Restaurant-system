// controllers/settingsController.js
const Settings = require('../models/Settings'); // You might need to create this model

// Get settings
exports.getSettings = async (req, res) => {
  try {
    // Since you're using localStorage as fallback, let's create a default response
    const defaultSettings = { tableCount: 8, taxRate: 10 };
    
    // Try to get settings from DB if model exists
    let settings = defaultSettings;
    
    // If you have a Settings model, use this:
    // settings = await Settings.findOne() || defaultSettings;
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};