// controllers/settingsController.js
const Settings = require('../models/Settings');

// Get settings
exports.getSettings = async (req, res) => {
  try {
    // Try to find existing settings
    let settings = await Settings.findOne({});
    
    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = {
        restaurantName: "Viet Nam Cuisine",
        contactNumber: "(+84) 123 456 789",
        email: "info@vietnamcuisine.com",
        taxRate: 10,
        tableCount: 8,
        reservedTables: [5]
      };
      
      settings = await Settings.create(defaultSettings);
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add update capability - you'll need this for saving settings
exports.updateSettings = async (req, res) => {
  try {
    // Find existing settings or create if none exist
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings({});
    }
    
    // Update fields if provided
    const { restaurantName, contactNumber, email, taxRate, tableCount, reservedTables } = req.body;
    
    if (restaurantName !== undefined) settings.restaurantName = restaurantName;
    if (contactNumber !== undefined) settings.contactNumber = contactNumber;
    if (email !== undefined) settings.email = email;
    if (taxRate !== undefined) settings.taxRate = taxRate;
    if (tableCount !== undefined) settings.tableCount = tableCount;
    if (reservedTables !== undefined) settings.reservedTables = reservedTables;
    
    // Save updated settings
    const updatedSettings = await settings.save();
    
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};