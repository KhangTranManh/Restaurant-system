const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Remove the duplicate route
router.get('/', orderController.getOrders);
router.get('/table/:table_number', orderController.getOrdersByTable);
router.get('/:order_id', orderController.getOrder);
router.post('/', orderController.createOrder);
router.put('/:order_id/status', orderController.updateOrderStatus);

module.exports = router;