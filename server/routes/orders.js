const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// IMPORTANT: Special routes must come BEFORE parameterized routes
// Revenue endpoint
router.get('/revenue', async (req, res) => {
  try {
    // Get today's and this week's start dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get delivered orders from today and this week
    const todayOrders = await Order.find({
      status: 'delivered',
      $or: [
        { delivered_at: { $gte: today } },
        { updatedAt: { $gte: today } }
      ]
    });
    
    const weekOrders = await Order.find({
      status: 'delivered',
      $or: [
        { delivered_at: { $gte: startOfWeek } },
        { updatedAt: { $gte: startOfWeek } }
      ]
    });
    
    // Calculate total revenue with detailed logging
    const todayRevenue = todayOrders.reduce((sum, order) => {
      console.log(`Today Order ${order._id}: ${order.total_amount}`);
      return sum + (order.total_amount || 0);
    }, 0);
    
    const weekRevenue = weekOrders.reduce((sum, order) => {
      console.log(`Week Order ${order._id}: ${order.total_amount}`);
      return sum + (order.total_amount || 0);
    }, 0);
    
    console.log("Revenue stats:", { 
      today: todayRevenue, 
      week: weekRevenue,
      todayOrderCount: todayOrders.length,
      weekOrderCount: weekOrders.length
    });
    
    res.json({
      today: todayRevenue,
      week: weekRevenue
    });
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Stats endpoint
router.get('/stats', async (req, res) => {
  try {
    // Get start of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count active orders
    const active = await Order.countDocuments({
      status: { $in: ['pending', 'preparing', 'ready'] }
    });
    
    // Count orders completed today
    const completedToday = await Order.countDocuments({
      status: 'delivered',
      $or: [
        { delivered_at: { $gte: today } },
        { updatedAt: { $gte: today } }
      ]
    });
    
    res.json({
      active,
      completedToday
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Table orders (this is also a special route, not a general parameter)
router.get('/table/:table_number', orderController.getOrdersByTable);

// Regular routes
router.get('/', orderController.getOrders);
router.post('/', orderController.createOrder);
router.put('/:order_id/status', orderController.updateOrderStatus);

// IMPORTANT: This must be the LAST route - it will catch any other paths
router.get('/:order_id', orderController.getOrder);

module.exports = router;