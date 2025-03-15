const MenuItem = require('../models/MenuItem');
const MenuCategory = require('../models/MenuCategory');
const mongoose = require('mongoose');

// Get all menu categories
exports.getCategories = async (req, res) => {
  try {
    const menuType = req.query.menu_type || 'a-la-carte';
    // In a real app, filter by menu type
    const categories = await MenuCategory.find();
    res.json(categories);
  } catch (error) {
    console.error('Error getting menu categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all menu items
exports.getMenuItems = async (req, res) => {
  try {
    const categoryId = req.query.category_id;
    const search = req.query.search || '';
    const menuType = req.query.menu_type || 'a-la-carte';
    
    let query = {};
    
    // Filter by category if provided
    if (categoryId) {
      const category = await MenuCategory.findOne({ 
        $or: [
          { _id: mongoose.isValidObjectId(categoryId) ? categoryId : null },
          { category_id: parseInt(categoryId) || 0 }
        ]
      });
      
      if (category) {
        query.category = category._id;
      }
    }
    
    // Filter by search term if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // In a real app, filter by menu type as well
    
    const menuItems = await MenuItem.find(query).populate('category');
    res.json(menuItems);
  } catch (error) {
    console.error('Error getting menu items:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific menu item
exports.getMenuItem = async (req, res) => {
  try {
    const itemId = req.params.item_id;
    
    const menuItem = await MenuItem.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(itemId) ? itemId : null },
        { item_id: parseInt(itemId) || 0 }
      ]
    }).populate('category');
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json(menuItem);
  } catch (error) {
    console.error('Error getting menu item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};