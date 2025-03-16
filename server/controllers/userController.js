const User = require('../models/user');

// Get all users or filter by role
exports.getUsers = async (req, res) => {
  try {
    const roles = req.query.role ? req.query.role.split(',') : [];
    
    const query = roles.length > 0 ? { role: { $in: roles } } : {};
    
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { username, password, name, role, contact, status } = req.body;
    
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Create new user with contact field
    const newUser = new User({
      username,
      password, // Will be hashed by the pre-save hook
      name,
      role,
      contact, // This might need to be added to your User model
      status: status || 'active'
    });
    
    const savedUser = await newUser.save();
    
    // Don't return password in response
    const userResponse = {
      _id: savedUser._id,
      username: savedUser.username,
      name: savedUser.name,
      role: savedUser.role,
      contact: savedUser.contact,
      status: savedUser.status
    };
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { username, password, name, role, contact, status } = req.body;
    
    // Check if username already exists (except for this user)
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }
    
    // Get current user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (username) user.username = username;
    if (password) user.password = password; // Will be hashed by pre-save hook
    if (name) user.name = name;
    if (role) user.role = role;
    if (contact !== undefined) user.contact = contact;
    if (status) user.status = status;
    
    const updatedUser = await user.save();
    
    // Don't return password in response
    const userResponse = {
      _id: updatedUser._id,
      username: updatedUser.username,
      name: updatedUser.name,
      role: updatedUser.role,
      contact: updatedUser.contact,
      status: updatedUser.status
    };
    
    res.json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await User.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    // Count total staff (any role that isn't admin or customer)
    const totalStaff = await User.countDocuments({
      role: { $in: ['staff', 'chef', 'bartender', 'waiter', 'kitchen'] }
    });
    
    // Count kitchen staff
    const kitchenStaff = await User.countDocuments({
      role: { $in: ['chef', 'bartender', 'kitchen'] }
    });
    
    // Count active users
    const activeUsers = await User.countDocuments({ 
      status: 'active'
    });
    
    // Count admin users
    const adminUsers = await User.countDocuments({
      role: 'admin'
    });
    
    res.json({
      totalStaff,
      kitchenStaff,
      activeUsers,
      adminUsers
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};