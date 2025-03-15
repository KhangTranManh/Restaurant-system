const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const { io } = require('../config/socket');
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

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { tableId, items } = req.body;
    
    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Table ID and items are required' });
    }
    
    // Find table
    const table = await Table.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(tableId) ? tableId : null },
        { table_number: parseInt(tableId) || 0 }
      ]
    });
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Process order items
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
    io.emit('newOrder', {
      _id: savedOrder._id,
      orderId: savedOrder._id,
      tableId: table._id,
      tableNumber: table.table_number,
      status: savedOrder.status,
      items: savedOrder.items,
      totalAmount: savedOrder.total_amount,
      createdAt: savedOrder.created_at
    });
    
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.order_id;
    const { status } = req.body;
    
    if (!['pending', 'preparing', 'ready', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update order status
    const oldStatus = order.status;
    order.status = status;
    
    // Set timestamps based on status
    if (status === 'ready' && !order.ready_at) {
      order.ready_at = new Date();
    } else if (status === 'delivered' && !order.delivered_at) {
      order.delivered_at = new Date();
    }
    
    await order.save();
    
    // If order is delivered, check if the table should be updated
    if (status === 'delivered' && oldStatus !== 'delivered') {
      const table = await Table.findById(order.table);
      
      if (table && table.current_order_id && table.current_order_id.equals(order._id)) {
        // Check if there are other active orders for this table
        const otherActiveOrders = await Order.countDocuments({
          table: table._id,
          _id: { $ne: order._id },
          status: { $nin: ['delivered', 'cancelled'] }
        });
        
        if (otherActiveOrders === 0) {
          // No other active orders, set table to available
          table.status = 'available';
          table.current_order_id = null;
          await table.save();
          
          // Notify about table change
          io.emit('tableStatusChanged', {
            tableId: table._id,
            tableNumber: table.table_number,
            status: 'available'
          });
        }
      }
    }
    
    // Notify clients via Socket.IO
    io.emit('orderStatusChanged', {
      orderId: order._id,
      status: order.status,
      timestamp: new Date().toISOString()
    });
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};