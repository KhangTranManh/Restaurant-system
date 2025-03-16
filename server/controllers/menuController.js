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
// Create new menu item
exports.createMenuItem = async (req, res) => {
  try {
    const { name, vietnameseName, category, price, status, description, preparation_time } = req.body;
    
    // Validate required fields
    if (!name || !category || !price) {
      return res.status(400).json({ message: 'Name, category and price are required' });
    }
    
    // Find or create category
    let categoryObj;
    
    if (mongoose.isValidObjectId(category)) {
      categoryObj = await MenuCategory.findById(category);
    } else {
      // Try to find by name
      categoryObj = await MenuCategory.findOne({ name: { $regex: new RegExp('^' + category + '$', 'i') } });
      
      // If not found, create a new category
      if (!categoryObj) {
        categoryObj = new MenuCategory({
          name: category,
          description: `${category} category`
        });
        await categoryObj.save();
      }
    }
    
    // Create new menu item
    const newMenuItem = new MenuItem({
      name,
      vietnameseName: vietnameseName || name,
      category: categoryObj._id,
      price,
      status: status || 'available',
      description: description || '',
      preparation_time: preparation_time || 10,
      image_path: '/images/default-dish.jpg'
    });
    
    const savedMenuItem = await newMenuItem.save();
    
    // Populate category for response
    await savedMenuItem.populate('category');
    
    res.status(201).json(savedMenuItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const itemId = req.params.item_id;
    const { name, vietnameseName, category, price, status, description, preparation_time } = req.body;
    
    // Find the menu item
    const menuItem = await MenuItem.findById(itemId);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    // Find or create category if changing
    if (category) {
      let categoryObj;
      
      if (mongoose.isValidObjectId(category)) {
        categoryObj = await MenuCategory.findById(category);
      } else {
        // Try to find by name
        categoryObj = await MenuCategory.findOne({ name: { $regex: new RegExp('^' + category + '$', 'i') } });
        
        // If not found, create a new category
        if (!categoryObj) {
          categoryObj = new MenuCategory({
            name: category,
            description: `${category} category`
          });
          await categoryObj.save();
        }
      }
      
      menuItem.category = categoryObj._id;
    }
    
    // Update fields if provided
    if (name) menuItem.name = name;
    if (vietnameseName) menuItem.vietnameseName = vietnameseName;
    if (price) menuItem.price = price;
    if (status) menuItem.status = status;
    if (description !== undefined) menuItem.description = description;
    if (preparation_time) menuItem.preparation_time = preparation_time;
    
    // Save updated menu item
    const updatedMenuItem = await menuItem.save();
    
    // Populate category for response
    await updatedMenuItem.populate('category');
    
    res.json(updatedMenuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const itemId = req.params.item_id;
    
    // Find and delete the menu item
    const result = await MenuItem.findByIdAndDelete(itemId);
    
    if (!result) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    // Check if category already exists
    const existingCategory = await MenuCategory.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });
    
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    // Create new category
    const newCategory = new MenuCategory({
      name,
      description: description || `${name} category`
    });
    
    const savedCategory = await newCategory.save();
    
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get menu statistics
exports.getMenuStats = async (req, res) => {
  try {
    // Count total items
    const totalItems = await MenuItem.countDocuments();
    
    // Count unique categories
    const categories = await MenuCategory.countDocuments();
    
    // Count available items
    const availableItems = await MenuItem.countDocuments({ status: 'available' });
    
    // Get items by category
    const itemsByCategory = await MenuItem.aggregate([
      {
        $lookup: {
          from: 'menucategories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $group: {
          _id: '$categoryInfo.name',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json({
      totalItems,
      categories,
      availableItems,
      itemsByCategory
    });
  } catch (error) {
    console.error('Error getting menu stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};