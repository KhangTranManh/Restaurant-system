const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Remove the duplicate route
router.get('/', orderController.getOrders);
router.get('/table/:table_number', orderController.getOrdersByTable);
router.get('/:order_id', orderController.getOrder);
router.post('/', orderController.createOrder);
router.put('/:order_id/status', orderController.updateOrderStatus);
router.get('/stats', orderController.getOrderStats);

// Add these routes to your existing orders.js file

// Get order statistics
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
        updatedAt: { $gte: today }
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
  
  // Get revenue statistics
  router.get('/revenue', async (req, res) => {
    try {
      // Get start of today and this week
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of current week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Get orders for today
      const todayOrders = await Order.find({
        status: 'delivered',
        updatedAt: { $gte: today }
      });
      
      // Get orders for this week
      const weekOrders = await Order.find({
        status: 'delivered',
        updatedAt: { $gte: startOfWeek }
      });
      
      // Calculate revenue
      const todayRevenue = todayOrders.reduce((total, order) => total + order.total_amount, 0);
      const weekRevenue = weekOrders.reduce((total, order) => total + order.total_amount, 0);
      
      res.json({
        today: todayRevenue,
        week: weekRevenue
      });
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

module.exports = router;