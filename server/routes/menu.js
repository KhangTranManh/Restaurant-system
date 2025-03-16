const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.get('/categories', menuController.getCategories);
router.get('/items', menuController.getMenuItems);
router.get('/items/:item_id', menuController.getMenuItem);
// Get menu statistics
router.get('/stats', menuController.getMenuStats);

// Create a new menu item
router.post('/items', menuController.createMenuItem);

// Update a menu item
router.put('/items/:item_id', menuController.updateMenuItem);

// Delete a menu item
router.delete('/items/:item_id', menuController.deleteMenuItem);

// Create a new category
router.post('/categories', menuController.createCategory);

module.exports = router;