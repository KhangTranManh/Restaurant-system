// kitchen.js - Kitchen dashboard functionality

// Sample orders array for local state management
let orders = [];

// DOM Elements for Admin Page (only used if in admin mode)
let adminStaffBtn;
let adminKitchenBtn;
let adminAnalyticsBtn;
let adminStaffView;
let adminKitchenView;
let adminAnalyticsView;

document.addEventListener('DOMContentLoaded', function() {
  console.log("Kitchen page loaded");
  
  // Define these at the top
  const pendingOrdersContainer = document.getElementById('kitchen-pending-orders');
  const noOrdersMessage = document.getElementById('no-pending-orders');
  
  // Check authentication
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  // If not logged in or not kitchen staff/admin, redirect to login
  if (!currentUser || (currentUser.role !== 'kitchen' && currentUser.role !== 'admin')) {
    window.location.href = '/views/login.html';
    return;
  }
  
  // Fetch initial orders
  fetchInitialOrders();
  
  // Setup other functionality
  setupKitchenFunctionality();
  setupRealTimeUpdates();
});

async function fetchInitialOrders() {
  try {
    const response = await fetch('/api/orders');
    orders = await response.json();
    
    console.log("Fetched orders - Full list:", orders);
    
    // Render orders in different tabs
    renderPendingOrders();
    renderPreparingOrders();
    renderCompletedOrders();
    updateDashboardStats();
  } catch (error) {
    console.error('Error fetching initial orders:', error);
  }
}
// Render orders in different tabs
function renderPendingOrders() {
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const pendingContainer = document.getElementById('kitchen-pending-orders');
  const noPendingMessage = document.getElementById('no-pending-orders');
  
  if (pendingContainer) {
    pendingContainer.innerHTML = '';
    
    if (pendingOrders.length === 0) {
      noPendingMessage.classList.remove('hidden');
    } else {
      noPendingMessage.classList.add('hidden');
      pendingOrders.forEach(order => addOrderToKitchenView(order));
    }
  }
}
function renderPreparingOrders() {
  // Get all unique orders in 'preparing' status
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const preparingContainer = document.getElementById('kitchen-preparing-orders');
  const noPreparingMessage = document.getElementById('no-preparing-orders');
  
  if (preparingContainer) {
    // Clear the container first
    preparingContainer.innerHTML = '';
    
    if (preparingOrders.length === 0) {
      noPreparingMessage.classList.remove('hidden');
    } else {
      noPreparingMessage.classList.add('hidden');
      
      // Create a Set to track order IDs we've already rendered
      const renderedOrderIds = new Set();
      
      preparingOrders.forEach(order => {
        const orderId = order._id || order.order_id;
        
        // Only render if we haven't seen this order ID yet
        if (!renderedOrderIds.has(orderId)) {
          renderedOrderIds.add(orderId);
          moveOrderToPreparation(order);
        }
      });
    }
  }
}
function renderCompletedOrders() {
  const completedOrders = orders.filter(order => order.status === 'ready');
  const completedContainer = document.getElementById('kitchen-completed-orders');
  const noCompletedMessage = document.getElementById('no-completed-orders');
  
  if (completedContainer) {
    completedContainer.innerHTML = '';
    
    if (completedOrders.length === 0) {
      noCompletedMessage.classList.remove('hidden');
    } else {
      noCompletedMessage.classList.add('hidden');
      completedOrders.forEach(order => moveOrderToCompleted(order));
    }
  }
}
function setupRealTimeUpdates() {
  // Determine correct WebSocket URL based on current location
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/api/socket`;
  
  console.log(`Connecting to WebSocket at ${wsUrl}`);
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = function() {
    console.log('Kitchen WebSocket connection established');
  };
  
  socket.onmessage = function(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      
      // Handle different types of events
      if (data.type === 'newOrder' && data.order) {
        const newOrder = data.order;
        // Check if the order is already in our list
        if (!orders.some(o => o._id === newOrder._id || o.order_id === newOrder._id)) {
          // Add new order to the list
          orders.push(newOrder);
          
          // Only add to kitchen view if status is pending
          if (newOrder.status === 'pending') {
            addOrderToKitchenView(newOrder);
          }
          
          // Update dashboard stats
          updateDashboardStats();
        }
      } else if (data.type === 'orderStatusChanged' && data.order) {
        // Find and update the order in our local array
        const updatedOrder = data.order;
        const orderIndex = orders.findIndex(o => 
          o._id === updatedOrder._id || 
          o.order_id === updatedOrder._id
        );
        
        if (orderIndex !== -1) {
          orders[orderIndex] = updatedOrder;
        } else {
          orders.push(updatedOrder);
        }
        
        // Refresh all tabs
        renderPendingOrders();
        renderPreparingOrders();
        renderCompletedOrders();
        updateDashboardStats();
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };
  
  socket.onerror = function(error) {
    console.error('WebSocket error:', error);
  };
  
  socket.onclose = function() {
    console.log('WebSocket connection closed. Attempting to reconnect...');
    // Try to reconnect after a delay
    setTimeout(setupRealTimeUpdates, 5000);
  };
}

// Initialize kitchen functionality
function setupKitchenFunctionality() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Hide all tab content
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      // Show content for clicked tab
      const tabId = this.dataset.tab;
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Start cooking functionality
  document.querySelectorAll('.start-cooking').forEach(button => {
    button.addEventListener('click', function() {
      const orderId = this.dataset.id;
      alert(`Started preparation for Order #${orderId}`);
      
      // In a real app, this would update the order status on the server
      // and move the order to the preparing tab
      
      // For demonstration, we'll just hide the order card
      this.closest('.kitchen-order-card').style.display = 'none';
      
      // Check if there are any orders left
      const remainingOrders = document.querySelectorAll('#kitchen-pending-orders .kitchen-order-card:not([style="display: none;"])').length;
      if (remainingOrders === 0) {
        document.getElementById('no-pending-orders').classList.remove('hidden');
      }
      
      // Update the stats
      const pendingCountEl = document.querySelector('.dashboard-stats .stat-card:first-child .stat-value');
      const preparingCountEl = document.querySelector('.dashboard-stats .stat-card:nth-child(2) .stat-value');
      
      pendingCountEl.textContent = parseInt(pendingCountEl.textContent) - 1;
      preparingCountEl.textContent = parseInt(preparingCountEl.textContent) + 1;
      
      // If in admin mode, also update order status in sample orders
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (currentUser && currentUser.role === 'admin') {
        updateOrderStatus(orderId, 'preparing');
      }
    });
  });
  
  // Complete cooking functionality
  document.querySelectorAll('.complete-cooking').forEach(button => {
    button.addEventListener('click', function() {
      const orderId = this.dataset.id;
      alert(`Order #${orderId} marked as ready for service`);
      
      // In a real app, this would update the order status on the server
      // and move the order to the completed tab
      
      // For demonstration, we'll just hide the order card
      this.closest('.kitchen-order-card').style.display = 'none';
      
      // Check if there are any orders left
      const remainingOrders = document.querySelectorAll('#kitchen-preparing-orders .kitchen-order-card:not([style="display: none;"])').length;
      if (remainingOrders === 0) {
        document.getElementById('no-preparing-orders').classList.remove('hidden');
      }
      
      // Update the stats
      const preparingCountEl = document.querySelector('.dashboard-stats .stat-card:nth-child(2) .stat-value');
      const completedCountEl = document.querySelector('.dashboard-stats .stat-card:nth-child(3) .stat-value');
      
      preparingCountEl.textContent = parseInt(preparingCountEl.textContent) - 1;
      completedCountEl.textContent = parseInt(completedCountEl.textContent) + 1;
      
      // If in admin mode, also update order status in sample orders
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (currentUser && currentUser.role === 'admin') {
        updateOrderStatus(orderId, 'ready');
      }
    });
  });
  
  // General kitchen action buttons
  document.querySelectorAll('.kitchen-order-footer button.primary').forEach(button => {
    button.addEventListener('click', function() {
      const action = button.textContent.trim();
      const orderCard = button.closest('.kitchen-order-card');
      if (orderCard) {
        const orderTitle = orderCard.querySelector('.kitchen-order-title span');
        
        if (orderTitle) {
          const orderNumber = orderTitle.textContent.trim();
          
          switch(action) {
            case 'Start':
              alert(`Starting preparation for Order #${orderNumber}`);
              // In a real app, update order status to 'in progress'
              orderCard.classList.add('in-progress');
              button.textContent = 'Complete';
              break;
            
            case 'Complete':
              alert(`Completing Order #${orderNumber}`);
              // In a real app, update order status to 'completed'
              orderCard.classList.add('completed');
              orderCard.classList.remove('in-progress');
              orderCard.remove(); // Remove from kitchen view
              break;
          }
        }
      }
    });
  });
  
  // Logout functionality with proper path
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function() {
    // Remove localStorage.removeItem('currentUser');
    
    // Redirect to login page
    window.location.href = '/views/login.html';
  });
}
  
  // Set up order timer updating
  setupTimerUpdates();
}

// Setup order timer updates
function setupTimerUpdates() {
  // Update order timer every minute
  function updateTimers() {
    // Update pending order timers
    document.querySelectorAll('#kitchen-pending-orders .kitchen-order-timer').forEach(timer => {
      const timeElement = timer.querySelector('span:last-child');
      if (timeElement.textContent !== 'Just arrived') {
        const minutes = parseInt(timeElement.textContent.split(' ')[0]) + 1;
        timeElement.textContent = `${minutes} minutes`;
        
        // Mark as urgent if waiting for more than 10 minutes
        if (minutes > 10) {
          timer.classList.add('urgent');
        }
      } else {
        timeElement.textContent = '1 minute';
      }
    });
    
    // Update preparing order timers
    document.querySelectorAll('#kitchen-preparing-orders .kitchen-order-timer').forEach(timer => {
      const timeElement = timer.querySelector('span:last-child');
      const minutes = parseInt(timeElement.textContent.split(' ')[0]) + 1;
      timeElement.textContent = `${minutes} minutes`;
      
      // Mark as urgent if preparing for more than 20 minutes
      if (minutes > 20) {
        timer.classList.add('urgent');
      }
    });
  }
  
  // Update timers every minute
  setInterval(updateTimers, 60000);
}

// Initialize admin mode elements
function initializeAdminElements() {
  console.log("Initializing admin-specific functionality");
  
  // Get admin-specific DOM elements
  adminStaffBtn = document.getElementById('admin-staff-btn');
  adminKitchenBtn = document.getElementById('admin-kitchen-btn');
  adminAnalyticsBtn = document.getElementById('admin-analytics-btn');
  adminStaffView = document.getElementById('admin-staff-view');
  adminKitchenView = document.getElementById('admin-kitchen-view');
  adminAnalyticsView = document.getElementById('admin-analytics-view');
  
  // Setup admin-specific functionality if elements exist
  if (adminStaffBtn || adminKitchenBtn || adminAnalyticsBtn) {
    setupTabButtons();
    setupTableButtons();
    setupOrderButtons();
    setupCharts();
  }
}

// Function to update order status in kitchen view
function updateKitchenOrderStatus(orderId, newStatus) {
  // Implement based on your kitchen.js logic
  // This will vary depending on how your kitchen tracks orders
}
function moveOrderToPreparation(order) {
  // Find the order data
  if (!order) {
    console.error('No order provided');
    return;
  }
  
  // Format the time elements
  const orderTime = new Date(order.created_at);
  const formattedTime = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const prepStartTime = new Date();
  
  // Calculate estimated completion time (20 minutes from now)
  const estCompletionTime = new Date(prepStartTime.getTime() + 20 * 60 * 1000);
  const formattedCompletionTime = estCompletionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Create a new card for the In Preparation tab
  const preparingCard = document.createElement('div');
  preparingCard.className = 'kitchen-order-card preparing';
  
  preparingCard.innerHTML = `
    <div class="kitchen-order-header preparing">
      <div class="kitchen-order-title">
        <span>Order #${order._id || order.order_id}</span>
        <span class="badge blue">In Preparation</span>
      </div>
      <div class="kitchen-order-subtitle">
        <span>Table ${order.table_number}</span>
        <span>${formattedTime}</span>
      </div>
    </div>
    <div class="kitchen-order-content">
      <div class="kitchen-order-items">
        ${order.items.map(item => `
          <div class="kitchen-order-item">
            <div class="kitchen-order-item-name">${item.quantity}x ${item.menu_item_name}</div>
            ${item.special_instructions ? `<div class="kitchen-order-item-notes">${item.special_instructions}</div>` : ''}
            <div class="status-label preparing">Preparing</div>
          </div>
        `).join('')}
      </div>
      <div class="kitchen-order-timer">
        <span>Preparing for:</span>
        <span>0 minutes</span>
      </div>
    </div>
    <div class="kitchen-order-footer">
      <div>
        <span class="font-medium">Est. completion:</span> ${formattedCompletionTime}
      </div>
      <button class="primary complete-cooking" data-id="${order._id || order.order_id}">Mark as Ready</button>
    </div>
  `;
  
  // Add the new card to the In Preparation tab
  const preparingContainer = document.getElementById('kitchen-preparing-orders');
  const noPreparingOrders = document.getElementById('no-preparing-orders');
  
  if (preparingContainer) {
    preparingContainer.appendChild(preparingCard);
    
    // Hide the "no orders" message if it's visible
    if (noPreparingOrders) {
      noPreparingOrders.classList.add('hidden');
    }
    
    // Add event listener to the Mark as Ready button
    const completeButton = preparingCard.querySelector('.complete-cooking');
    if (completeButton) {
      completeButton.addEventListener('click', async function() {
        const orderId = this.dataset.id;
        
        try {
          // Update order status to 'ready'
          const updatedOrder = await updateOrderStatus(orderId, 'ready');
          
          if (updatedOrder) {
            // Remove this card from the In Preparation tab
            this.closest('.kitchen-order-card').remove();
            
            // Check if there are any orders left
            if (preparingContainer.querySelectorAll('.kitchen-order-card').length === 0 && noPreparingOrders) {
              noPreparingOrders.classList.remove('hidden');
            }
          }
        } catch (error) {
          console.error('Error marking order as ready:', error);
        }
      });
    }
  }
}
// In kitchen.js - Fix the Start Preparing button click handler

// First, find where the event listeners are being attached to the buttons
// Look for this section in the code
function addOrderToKitchenView(order) {
  console.log("Full order object:", order);
  
  const orderId = order._id || order.order_id;
  console.log("Extracted Order ID:", orderId);
  
  if (!orderId) {
    console.error("No valid order ID found for order:", order);
    return;
  }
  
  // Get the container for pending orders
  const pendingOrdersContainer = document.getElementById('kitchen-pending-orders');
  const noOrdersMessage = document.getElementById('no-pending-orders');
  
  if (!pendingOrdersContainer) {
    console.error("Pending orders container not found");
    return;
  }
  
  // Hide "no orders" message if visible
  if (noOrdersMessage) {
    noOrdersMessage.classList.add('hidden');
  }
  
  // Create new order card
  const orderCard = document.createElement('div');
  orderCard.className = 'kitchen-order-card pending';
  
  // Format order creation time
  const orderTime = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Populate order card with order details
  orderCard.innerHTML = `
    <div class="kitchen-order-header pending">
      <div class="kitchen-order-title">
        <span>Order #${orderId}</span>
        <span class="badge yellow">New Order</span>
      </div>
      <div class="kitchen-order-subtitle">
        <span>Table ${order.table_number}</span>
        <span>${orderTime}</span>
      </div>
    </div>
    <div class="kitchen-order-content">
      <div class="kitchen-order-items">
        ${order.items.map(item => `
          <div class="kitchen-order-item">
            <div class="kitchen-order-item-name">${item.quantity}x ${item.menu_item_name}</div>
            ${item.special_instructions ? `<div class="kitchen-order-item-notes">${item.special_instructions}</div>` : ''}
          </div>
        `).join('')}
      </div>
      <div class="kitchen-order-timer">
        <span>Waiting for:</span>
        <span>Just arrived</span>
      </div>
    </div>
    <div class="kitchen-order-footer">
      <button class="primary start-cooking" data-order-id="${orderId}">Start Preparing</button>
    </div>
  `;
  
  // Add order card to pending orders container
  pendingOrdersContainer.appendChild(orderCard);
  
  // Add event listener to the new start cooking button
  // Add event listener to the new start cooking button
const startCookingBtn = orderCard.querySelector('.start-cooking');
if (startCookingBtn) {
  startCookingBtn.addEventListener('click', function() {
    const clickedOrderId = this.dataset.orderId;
    console.log("Start cooking button clicked for order:", clickedOrderId);
    
    if (!clickedOrderId) {
      console.error("Order ID not found in button dataset");
      return;
    }
    
    // Remove the card immediately to prevent duplicate clicks
    const orderCard = this.closest('.kitchen-order-card');
    if (orderCard) {
      orderCard.remove();
    }
    
    updateOrderStatus(clickedOrderId, 'preparing')
      .then(updatedOrder => {
        if (updatedOrder) {
          // No need to do anything else, the renderPreparingOrders function will handle it
          updateDashboardStats();
        }
      })
      .catch(error => {
        console.error('Error starting preparation:', error);
        // If there was an error, re-render the pending orders to show the card again
        renderPendingOrders();
      });
  });
}
}

function moveOrderToPreparation(order) {
  // Check if we received an actual order object
  if (!order) {
    console.error('No order provided to moveOrderToPreparation');
    return;
  }
  
  console.log("Moving order to preparation:", order);
  
  // Format the time elements
  const orderTime = new Date(order.created_at);
  const formattedTime = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const prepStartTime = new Date();
  
  // Calculate estimated completion time (20 minutes from now)
  const estCompletionTime = new Date(prepStartTime.getTime() + 20 * 60 * 1000);
  const formattedCompletionTime = estCompletionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Extract the order ID (handle both _id and order_id formats)
  const orderId = order._id || order.order_id;
  
  // Create a new card for the In Preparation tab
  const preparingCard = document.createElement('div');
  preparingCard.className = 'kitchen-order-card preparing';
  
  preparingCard.innerHTML = `
    <div class="kitchen-order-header preparing">
      <div class="kitchen-order-title">
        <span>Order #${orderId}</span>
        <span class="badge blue">In Preparation</span>
      </div>
      <div class="kitchen-order-subtitle">
        <span>Table ${order.table_number}</span>
        <span>${formattedTime}</span>
      </div>
    </div>
    <div class="kitchen-order-content">
      <div class="kitchen-order-items">
        ${order.items.map(item => `
          <div class="kitchen-order-item">
            <div class="kitchen-order-item-name">${item.quantity}x ${item.menu_item_name}</div>
            ${item.special_instructions ? `<div class="kitchen-order-item-notes">${item.special_instructions}</div>` : ''}
            <div class="status-label preparing">Preparing</div>
          </div>
        `).join('')}
      </div>
      <div class="kitchen-order-timer">
        <span>Preparing for:</span>
        <span>0 minutes</span>
      </div>
    </div>
    <div class="kitchen-order-footer">
      <div>
        <span class="font-medium">Est. completion:</span> ${formattedCompletionTime}
      </div>
      <button class="primary complete-cooking" data-order-id="${orderId}">Mark as Ready</button>
    </div>
  `;
  
  // Add the new card to the In Preparation tab
  const preparingContainer = document.getElementById('kitchen-preparing-orders');
  const noPreparingOrders = document.getElementById('no-preparing-orders');
  
  if (preparingContainer) {
    preparingContainer.appendChild(preparingCard);
    
    // Hide the "no orders" message if it's visible
    if (noPreparingOrders) {
      noPreparingOrders.classList.add('hidden');
    }
    
    // Add event listener to the Mark as Ready button
    const completeButton = preparingCard.querySelector('.complete-cooking');
    if (completeButton) {
      completeButton.addEventListener('click', function() {
        const clickedOrderId = this.dataset.orderId;
        console.log("Mark as Ready clicked for order:", clickedOrderId);
        
        updateOrderStatus(clickedOrderId, 'ready')
          .then(updatedOrder => {
            if (updatedOrder) {
              // Remove from preparation and move to ready
              this.closest('.kitchen-order-card').remove();
              moveOrderToCompleted(updatedOrder);
              updateDashboardStats();
            }
          })
          .catch(error => {
            console.error('Error marking order as ready:', error);
          });
      });
    }
  }
}
async function updateOrderStatus(orderId, newStatus) {
  try {
    console.log("Updating order status:", { 
      orderId, 
      newStatus
    });
    
    // Ensure orderId is defined
    if (!orderId) {
      throw new Error('Invalid order ID: ID is undefined or null');
    }

    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        status: newStatus
      })
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Failed to update order status: ${errorText}`);
    }
    
    const updatedOrder = await response.json();
    console.log("Updated order:", updatedOrder);
    
    // Update local orders array
    const orderIndex = orders.findIndex(o => 
      o._id === updatedOrder._id || 
      o.order_id === updatedOrder._id ||
      o._id === updatedOrder.order_id
    );
    
    if (orderIndex !== -1) {
      orders[orderIndex] = updatedOrder;
    } else {
      // If not found, add the new order
      orders.push(updatedOrder);
    }
    
    // Refresh the view based on the new status
    if (newStatus === 'preparing') {
      renderPendingOrders();  // Remove from pending
      renderPreparingOrders(); // Add to preparing
    } else if (newStatus === 'ready') {
      renderPreparingOrders(); // Remove from preparing
      renderCompletedOrders(); // Add to completed
    }
    
    updateDashboardStats();
    
    return updatedOrder;
  } catch (error) {
    console.error(`Error updating order ${orderId} status:`, error);
    alert(`Failed to update order status: ${error.message}`);
    return null;
  }
}

// Function to move an order to the Completed Today tab
function moveOrderToCompleted(orderId) {
  // Find the order data
  const order = sampleOrders.find(o => o.order_id.toString() === orderId.toString());
  if (!order) {
    console.error(`Order #${orderId} not found in sampleOrders`);
    return;
  }
  
  // Format the time elements
  const orderTime = new Date(order.created_at);
  const formattedTime = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const readyTime = new Date();
  const formattedReadyTime = readyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Calculate prep time
  const prepStartTime = order.prep_start_time ? new Date(order.prep_start_time) : orderTime;
  const prepTimeMinutes = Math.round((readyTime - prepStartTime) / (1000 * 60));
  
  // Create a new card for the Completed Today tab
  const completedCard = document.createElement('div');
  completedCard.className = 'kitchen-order-card completed';
  
  completedCard.innerHTML = `
    <div class="kitchen-order-header">
      <div class="kitchen-order-title">
        <span>Order #${order.order_id}</span>
        <span class="badge green">Completed</span>
      </div>
      <div class="kitchen-order-subtitle">
        <span>Table ${order.table_number}</span>
        <span>Ready at: ${formattedReadyTime}</span>
      </div>
    </div>
    <div class="kitchen-order-content">
      <div class="kitchen-order-items">
        ${order.items.map(item => `
          <div class="kitchen-order-item">
            <div class="kitchen-order-item-name">${item.quantity}x ${item.menu_item_name}</div>
            ${item.special_instructions ? `<div class="kitchen-order-item-notes">${item.special_instructions}</div>` : ''}
          </div>
        `).join('')}
      </div>
      <div class="kitchen-order-timer">
        <span>Preparation time:</span>
        <span>${prepTimeMinutes} minutes</span>
      </div>
    </div>
  `;
  
  // Add the new card to the Completed Today tab
  const completedContainer = document.getElementById('kitchen-completed-orders');
  const noCompletedOrders = document.getElementById('no-completed-orders');
  
  if (completedContainer) {
    completedContainer.appendChild(completedCard);
    
    // Hide the "no orders" message if it's visible
    if (noCompletedOrders) {
      noCompletedOrders.classList.add('hidden');
    }
  }
  
  // Update dashboard stats
  const preparingCountEl = document.querySelector('.dashboard-stats .stat-card:nth-child(2) .stat-value');
  const completedCountEl = document.querySelector('.dashboard-stats .stat-card:nth-child(3) .stat-value');
  
  if (preparingCountEl) {
    const currentCount = parseInt(preparingCountEl.textContent);
    preparingCountEl.textContent = Math.max(0, currentCount - 1);
  }
  
  if (completedCountEl) {
    const currentCount = parseInt(completedCountEl.textContent);
    completedCountEl.textContent = currentCount + 1;
  }
}


// Helper function to refresh all tabs
function refreshAllTabs() {
 
}

// ========== ADMIN FUNCTIONS ==========

// Set up tab buttons for admin dashboard
function setupTabButtons() {
  console.log("Setting up admin tab buttons");
  
  if (!adminStaffBtn || !adminKitchenBtn || !adminStaffView || !adminKitchenView) {
    console.error("Admin view toggle elements not found");
    return;
  }
  
  // Staff view button
  adminStaffBtn.addEventListener('click', function() {
    // Update button styles
    adminStaffBtn.classList.add('primary');
    adminStaffBtn.classList.remove('secondary');
    adminKitchenBtn.classList.add('secondary');
    adminKitchenBtn.classList.remove('primary');
    
    if (adminAnalyticsBtn) {
      adminAnalyticsBtn.classList.add('secondary');
      adminAnalyticsBtn.classList.remove('primary');
    }
    
    // Show staff view, hide others
    adminStaffView.classList.remove('hidden');
    adminKitchenView.classList.add('hidden');
    
    if (adminAnalyticsView) {
      adminAnalyticsView.classList.add('hidden');
    }
  });
  
  // Kitchen view button
  adminKitchenBtn.addEventListener('click', function() {
    // Update button styles
    adminKitchenBtn.classList.add('primary');
    adminKitchenBtn.classList.remove('secondary');
    adminStaffBtn.classList.add('secondary');
    adminStaffBtn.classList.remove('primary');
    
    if (adminAnalyticsBtn) {
      adminAnalyticsBtn.classList.add('secondary');
      adminAnalyticsBtn.classList.remove('primary');
    }
    
    // Show kitchen view, hide others
    adminKitchenView.classList.remove('hidden');
    adminStaffView.classList.add('hidden');
    
    if (adminAnalyticsView) {
      adminAnalyticsView.classList.add('hidden');
    }
  });
  
  // Analytics view button
  if (adminAnalyticsBtn && adminAnalyticsView) {
    adminAnalyticsBtn.addEventListener('click', function() {
      // Update button styles
      adminAnalyticsBtn.classList.add('primary');
      adminAnalyticsBtn.classList.remove('secondary');
      adminStaffBtn.classList.add('secondary');
      adminStaffBtn.classList.remove('primary');
      adminKitchenBtn.classList.add('secondary');
      adminKitchenBtn.classList.remove('primary');
      
      // Show analytics view, hide others
      adminAnalyticsView.classList.remove('hidden');
      adminStaffView.classList.add('hidden');
      adminKitchenView.classList.add('hidden');
    });
  }
}

// Set up table buttons in the admin staff view
function setupTableButtons() {
  console.log("Setting up admin table buttons");
  
  const tableButtons = document.querySelectorAll('.tables-grid button');
  if (!tableButtons || tableButtons.length === 0) {
    console.error("Table buttons not found");
    return;
  }
  
  tableButtons.forEach(button => {
    button.addEventListener('click', function() {
      // In a real app, this would show table details
      alert(`Table ${this.textContent.trim()} details would be shown here`);
    });
  });
}

function setupOrderButtons() {
  console.log("Setting up admin order buttons");
  
  // Kitchen action buttons for pending orders
  document.querySelectorAll('.start-cooking').forEach(button => {
    button.addEventListener('click', function() {
      const orderCard = this.closest('.kitchen-order-card');
      
      // Use data-order-id instead of data-id
      const orderId = this.dataset.orderId;
      console.log("Start cooking button clicked:", {
        buttonDataOrderId: orderId,
        buttonElement: this
      });
      
      // Update order status to 'preparing'
      updateOrderStatus(orderId, 'preparing');
    });
  });
  
  // Kitchen action buttons for preparing orders
  document.querySelectorAll('.complete-cooking').forEach(button => {
    button.addEventListener('click', function() {
      const orderCard = this.closest('.kitchen-order-card');
      
      // Use data-order-id instead of data-id
      const orderId = this.dataset.orderId;
      console.log("Complete cooking button clicked:", {
        buttonDataOrderId: orderId,
        buttonElement: this
      });
      
      // Update order status to 'ready'
      updateOrderStatus(orderId, 'ready');
    });
  });
}

// Update dashboard statistics
function updateDashboardStats() {
  const pendingCount = orders.filter(order => order.status === 'pending').length;
  const preparingCount = orders.filter(order => order.status === 'preparing').length;
  const completedCount = orders.filter(order => order.status === 'ready').length;
  
  // Update stat cards
  const pendingCountEl = document.querySelector('.dashboard-stats .stat-card:first-child .stat-value');
  const preparingCountEl = document.querySelector('.dashboard-stats .stat-card:nth-child(2) .stat-value');
  const completedCountEl = document.querySelector('.dashboard-stats .stat-card:nth-child(3) .stat-value');
  
  if (pendingCountEl) pendingCountEl.textContent = pendingCount;
  if (preparingCountEl) preparingCountEl.textContent = preparingCount;
  if (completedCountEl) completedCountEl.textContent = completedCount;
}
// Check if there are any remaining orders in a specific tab
function checkRemainingOrders(tab) {
  const orderContainer = document.getElementById(`kitchen-${tab}-orders`);
  const noOrdersMessage = document.getElementById(`no-${tab}-orders`);
  
  if (!orderContainer || !noOrdersMessage) {
    console.warn(`Elements for checking remaining ${tab} orders not found`);
    return;
  }
  
  const remainingOrders = orderContainer.querySelectorAll('.kitchen-order-card').length;
  
  if (remainingOrders === 0) {
    noOrdersMessage.classList.remove('hidden');
  } else {
    noOrdersMessage.classList.add('hidden');
  }
}

// Set up analytics charts
function setupCharts() {
  console.log("Setting up admin analytics charts");
  
  // In a real application, this would initialize charts using a library like Chart.js
  const salesChart = document.getElementById('sales-chart');
  const revenueChart = document.getElementById('revenue-chart');
  const orderChart = document.getElementById('order-chart');
  
  if (salesChart && revenueChart && orderChart) {
    console.log("Charts are ready to be configured");
    // Sample chart data
    const chartData = {
      sales: [
        { month: 'Jan', amount: 1200 },
        { month: 'Feb', amount: 1500 },
        { month: 'Mar', amount: 1800 }
      ],
      revenue: [
        { month: 'Jan', amount: 3600 },
        { month: 'Feb', amount: 4500 },
        { month: 'Mar', amount: 5400 }
      ],
      orders: [
        { type: 'Dine-in', count: 150 },
        { type: 'Takeout', count: 80 },
        { type: 'Delivery', count: 50 }
      ]
    };
    
    // In a real app, this would render charts
    console.log("Chart data prepared:", chartData);
  }
}

// Performance monitoring and logging
function logPerformance() {
  if (window.performance) {
    const navigationTiming = window.performance.getEntriesByType('navigation')[0];
    if (navigationTiming) {
      console.log('Page Load Performance:');
      console.log(`Load Time: ${navigationTiming.loadEventEnd - navigationTiming.startTime} ms`);
      console.log(`DNS Lookup: ${navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart} ms`);
      console.log(`TCP Connect: ${navigationTiming.connectEnd - navigationTiming.connectStart} ms`);
      console.log(`Request Time: ${navigationTiming.responseEnd - navigationTiming.requestStart} ms`);
    }
  }
}

// Call performance logging when page is fully loaded
window.addEventListener('load', logPerformance);

// Error handling
window.addEventListener('error', function(event) {
  console.error('JavaScript Error:', event.message, 'at', event.filename, 'line', event.lineno);
});

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled Promise Rejection:', event.reason);
  // Optionally show a user-friendly error message
  alert('An unexpected error occurred. Please try again.');
});