const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const socketConfig = require('../config/socket');
const mongoose = require('mongoose');

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const tableId = req.query.table_id;
    const status = req.query.status;
    
    let query = {};
    
    // Filter by table if provided
    if (tableId) {
      const table = await Table.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(tableId) ? tableId : null },
          { table_number: parseInt(tableId) || 0 }
        ]
      });
      
      if (table) {
        query.table = table._id;
      }
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Find orders and sort by created_at (newest first)
    const orders = await Order.find(query)
      .sort({ created_at: -1 })
      .populate('table')
      .populate('items.menu_item');
    
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all orders for a specific table
exports.getOrdersByTable = async (req, res) => {
  try {
    const tableNumber = req.params.table_number;
    
    // Find the table first
    const table = await Table.findOne({ table_number: parseInt(tableNumber) || 0 });
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Find all orders for this table
    const orders = await Order.find({ table: table._id })
      .sort({ created_at: -1 })
      .populate('items.menu_item');
    
    res.json(orders);
  } catch (error) {
    console.error('Error getting table orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific order
exports.getOrder = async (req, res) => {
  try {
    const orderId = req.params.order_id;
    
    const order = await Order.findById(orderId)
      .populate('table')
      .populate('items.menu_item');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { tableId, items } = req.body;
    
    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Table ID and items are required' });
    }
    
    // Find table by table_number instead of _id
    const table = await Table.findOne({ table_number: parseInt(tableId) });
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    let total_amount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const menuItemId = item.menuItemId;
      const quantity = item.quantity || 1;
      const specialInstructions = item.specialInstructions || '';
      
      // Find menu item
      const menuItem = await MenuItem.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(menuItemId) ? menuItemId : null },
          { item_id: parseInt(menuItemId) || 0 }
        ]
      });
      
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item ${menuItemId} not found` });
      }
      
      // Calculate item price
      const itemPrice = menuItem.price;
      const itemTotal = itemPrice * quantity;
      total_amount += itemTotal;
      
      // Add to order items
      orderItems.push({
        menu_item: menuItem._id,
        menu_item_id: menuItem.item_id,
        menu_item_name: menuItem.name,
        quantity,
        item_price: itemPrice,
        special_instructions: specialInstructions
      });
    }
    
    // Create new order
    const newOrder = new Order({
      table: table._id,
      table_number: table.table_number,
      status: 'pending',
      items: orderItems,
      total_amount,
      created_at: new Date()
    });
    
    const savedOrder = await newOrder.save();
    
    // Update table status
    table.status = 'occupied';
    table.current_order_id = savedOrder._id;
    await table.save();
    
    // Notify clients via Socket.IO
    try {
      const io = socketConfig.getIO();
      
      // Emit event to kitchen about new order
      io.emit('newOrder', savedOrder);
      
      // Also emit to specific rooms
      io.to('kitchen').emit('newOrder', savedOrder);
      io.to(`table-${table.table_number}`).emit('orderUpdated', savedOrder);
      io.to('staff').emit('tableOrderUpdated', {
        tableNumber: table.table_number,
        order: savedOrder
      });
      
      console.log(`Emitted new order event for order ${savedOrder._id}`);
    } catch (error) {
      console.error('Socket.IO emission error:', error);
      // Continue with response even if socket emission fails
    }
    
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all active orders (pending, preparing, ready)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { status: 'pending' },
        { status: 'preparing' },
        { status: 'ready' }
      ]
    })
    .sort({ created_at: -1 })
    .populate('items.menu_item');
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    // Check both URL params and request body for the order ID
    const orderId = req.params.order_id || req.body.orderId;
    const { status } = req.body;
    
    console.log("Received order status update request:", { 
      orderId, 
      status,
      params: req.params,
      body: req.body
    });
    
    // Validate input
    if (!orderId) {
      console.error("Order ID is required");
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    // Try to find the order by either _id or order_id
    const order = await Order.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(orderId) ? orderId : null },
        { order_id: parseInt(orderId) || 0 }
      ]
    });
    
    if (!order) {
      console.error(`Order not found with ID: ${orderId}`);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update the status based on requested status
    const previousStatus = order.status;
    order.status = status;
    
    // Set timestamp for status changes
    if (status === 'ready') {
      order.ready_at = new Date();
    } else if (status === 'delivered') {
      order.delivered_at = new Date();
    }
    
    // Save the updated order
    const updatedOrder = await order.save();
    
    // If the status changes to 'delivered', update the table status if needed
    if (status === 'delivered') {
      // Check if there are any more active orders for this table
      const activeOrdersCount = await Order.countDocuments({
        table: order.table,
        status: { $in: ['pending', 'preparing', 'ready'] }
      });
      
      // If no more active orders, update table status to 'available'
      if (activeOrdersCount === 0) {
        await Table.findByIdAndUpdate(order.table, { status: 'available' });
      }
    }
    
    // Notify clients via Socket.IO
    try {
      const io = socketConfig.getIO();
      
      // Construct status update event data
      const statusUpdateData = {
        orderId: order._id,
        tableNumber: order.table_number,
        previousStatus,
        newStatus: status,
        order: updatedOrder
      };
      
      // Broadcast to everyone
      io.emit('orderStatusChanged', statusUpdateData);
      
      // Also emit to specific rooms
      io.to('kitchen').emit('orderStatusChanged', statusUpdateData);
      io.to(`table-${order.table_number}`).emit('orderStatusChanged', statusUpdateData);
      io.to('staff').emit('orderStatusChanged', statusUpdateData);
      
      console.log(`Emitted status change event for order ${order._id} from ${previousStatus} to ${status}`);
    } catch (error) {
      console.error('Socket.IO emission error:', error);
      // Continue with response even if socket emission fails
    }
    
    console.log("Order status updated successfully:", updatedOrder);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      message: 'Error updating order status', 
      error: error.message 
    });
  }
};