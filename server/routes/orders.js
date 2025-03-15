const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.getOrders);
router.get('/:order_id', orderController.getOrder);
router.post('/', orderController.createOrder);
router.put('/:order_id/status', orderController.updateOrderStatus);
router.get('/table/:table_number', orderController.getOrdersByTable);
router.put('/:order_id/status', orderController.updateOrderStatus);



module.exports = router;