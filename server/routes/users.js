const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');


// Get all users (with optional role filtering)
router.get('/', userController.getUsers);

router.get('/stats', userController.getUserStats);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create new user
router.post('/', userController.createUser);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

// Get user statistics - REMOVE this line since you're adding an inline implementation below
// router.get('/stats', userController.getUserStats);

// Stats endpoint
router.get('/stats', async (req, res) => {
  try {
    const User = require('../models/user');  // Make sure path is correct
    
    // Count staff on duty (active status)
    const onDuty = await User.countDocuments({ 
      status: 'active'
    });
    
    // Count kitchen staff specifically
    const kitchenStaff = await User.countDocuments({ 
      status: 'active',
      role: 'kitchen'
    });
    
    res.json({
      onDuty,
      kitchenStaff
    });
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;