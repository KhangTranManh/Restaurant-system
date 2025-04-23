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
      
      // Log special instructions for debugging
      if (data.order && data.order.specialInstructions) {
        console.log(`Special instructions for order #${data.order._id || data.order.order_id}: "${data.order.specialInstructions}"`);
      }
      
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
    // Try a different approach if the standard WebSocket connection fails
    tryAlternativeConnection();
  };
  
  socket.onclose = function() {
    console.log('WebSocket connection closed. Attempting to reconnect...');
    // Try to reconnect after a delay
    setTimeout(setupRealTimeUpdates, 5000);
  };
}

// Alternative connection method to try if the main one fails
function tryAlternativeConnection() {
  console.log("Trying alternative WebSocket connection method...");
  const wsUrl = `ws://localhost:5000/api/socket`;
  
  try {
    const altSocket = new WebSocket(wsUrl);
    
    altSocket.onopen = function() {
      console.log('Alternative WebSocket connection established');
    };
    
    altSocket.onerror = function(error) {
      console.error('Alternative WebSocket connection also failed:', error);
    };
  } catch (error) {
    console.error('Failed to create alternative WebSocket:', error);
  }
}
// Helper function to calculate waiting time from a timestamp
function getWaitingTime(timestamp) {
  if (!timestamp) {
    return "Just arrived";
  }
  
  const created = new Date(timestamp);
  const now = new Date();
  
  // Calculate difference in minutes
  const diffMs = now - created;
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 1) {
    return "Just arrived";
  } else if (diffMinutes === 1) {
    return "1 minute";
  } else {
    return `${diffMinutes} minutes`;
  }
}


// Make sure this function exists and properly displays special instructions
function addOrderToKitchenView(order) {
  // Create a new card for the order
  const orderCard = document.createElement('div');
  orderCard.className = 'kitchen-order-card pending';
  orderCard.setAttribute('data-order-id', order._id || order.order_id);
  
  // Format the created time
  const orderTime = new Date(order.created_at);
  const formattedTime = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Calculate waiting time
  const waitingTime = getWaitingTime(order.created_at);
  
  // Build the order card HTML
  orderCard.innerHTML = `
    <div class="kitchen-order-header pending">
      <div class="kitchen-order-title">
        <span>Order #${order._id || order.order_id}</span>
        <span class="badge yellow">New Order</span>
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
          </div>
        `).join('')}
      </div>
      
      ${order.specialInstructions ? `
      <div class="kitchen-order-special-instructions">
        <div class="special-instructions-label">
          <strong>Order Instructions:</strong>
        </div>
        <div class="special-instructions-text">${order.specialInstructions}</div>
      </div>
      ` : ''}
      
      <div class="kitchen-order-timer">
        <span>Waiting for:</span>
        <span>${waitingTime}</span>
      </div>
    </div>
    <div class="kitchen-order-footer">
      <button class="primary start-cooking" data-id="${order._id || order.order_id}">Start Preparing</button>
    </div>
  `;
  
  // Add event listener to the start cooking button
  const startButton = orderCard.querySelector('.start-cooking');
  if (startButton) {
    startButton.addEventListener('click', () => {
      startCookingOrder(order._id || order.order_id);
    });
  }
  
  // Append the new order card to the pending orders container
  const pendingOrdersContainer = document.getElementById('kitchen-pending-orders');
  if (pendingOrdersContainer) {
    pendingOrdersContainer.appendChild(orderCard);
    document.getElementById('no-pending-orders').classList.add('hidden');
  }
}
// Function to start cooking an order
async function startCookingOrder(orderId) {
  try {
    console.log(`Starting preparation for order ${orderId}`);
    
    // Show loading state
    const button = document.querySelector(`.start-cooking[data-id="${orderId}"]`);
    if (button) {
      button.disabled = true;
      button.textContent = "Processing...";
    }
    
    // Call the API to update the order status
    const updatedOrder = await updateOrderStatus(orderId, 'preparing');
    
    if (updatedOrder) {
      console.log("Order status updated to preparing:", updatedOrder);
      
      // Remove the order from the pending list
      const orderCard = document.querySelector(`.kitchen-order-card[data-order-id="${orderId}"]`);
      if (orderCard) {
        orderCard.remove();
      }
      
      // Check if there are any pending orders left
      checkRemainingOrders('pending');
      
      // Update dashboard stats
      updateDashboardStats();
    }
  } catch (error) {
    console.error('Error starting order preparation:', error);
    
    // Reset button state
    const button = document.querySelector(`.start-cooking[data-id="${orderId}"]`);
    if (button) {
      button.disabled = false;
      button.textContent = "Start Preparing";
    }
    
    alert(`Failed to start preparation: ${error.message}`);
  }
}
// Update this function in kitchen.js
// Update this part of kitchen.js to make all tabs work correctly

function setupKitchenFunctionality() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Hide all tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        // Make sure all tab content is hidden by default
        if (!content.classList.contains('hidden')) {
          content.classList.add('hidden');
        }
      });
      
      // Show content for clicked tab
      const tabId = this.dataset.tab;
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add('active');
        tabContent.classList.remove('hidden');
        
        // If menu management tab is clicked, load menu items
        if (tabId === 'menu-management') {
          displayMenuItems();
        }
      }
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
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      // Clear user session data from localStorage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('selectedTable');
      
      // Redirect to login page
      window.location.href = 'login.html';
      
      console.log("User logged out");
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
        
        if (!clickedOrderId) {
          console.error("Order ID not found in button dataset");
          return;
        }
        
        // Remove the card immediately to prevent duplicate clicks
        const orderCard = this.closest('.kitchen-order-card');
        if (orderCard) {
          orderCard.remove();
        }
        
        updateOrderStatus(clickedOrderId, 'ready')
          .then(updatedOrder => {
            if (updatedOrder) {
              // The order is now ready, no need to add it to the completed section
              // That will be handled by renderCompletedOrders
              updateDashboardStats();
            }
          })
          .catch(error => {
            console.error('Error marking order as ready:', error);
            // If there was an error, re-render the preparing orders to show the card again
            renderPreparingOrders();
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
// Replace this function in kitchen.js
function completeCooking(orderId) {
  if (!orderId) {
    console.error("Invalid order ID");
    return;
  }
  
  console.log(`Marking order ${orderId} as ready`);
  
  // Use the API to update the order status
  updateOrderStatus(orderId, 'ready')
    .then(updatedOrder => {
      if (updatedOrder) {
        console.log("Order marked as ready:", updatedOrder);
      }
    })
    .catch(error => {
      console.error("Error marking order as ready:", error);
    });
}

function moveOrderToCompleted(order) {
  // Check if we received an actual order object
  if (!order) {
    console.error('No order provided to moveOrderToCompleted');
    return;
  }
  
  console.log("Moving order to completed:", order);
  
  // Extract the order ID
  const orderId = order._id || order.order_id;
  
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
        <span>Order #${orderId}</span>
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
  updateDashboardStats();
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
// Add this code to kitchen.js to enable Menu Management functionality

// Additional initialization for the menu management tab
document.addEventListener('DOMContentLoaded', function() {
  // Add to the existing kitchen.js initialization
  setupMenuManagement();
});

// Initialize menu management functionality
function setupMenuManagement() {
  // Add menu item button
  const addMenuItemBtn = document.getElementById('add-menu-item-btn');
  if (addMenuItemBtn) {
    addMenuItemBtn.addEventListener('click', function() {
      openMenuItemModal();
    });
  }
  
  // Save menu item button
  const saveMenuItemBtn = document.getElementById('save-menu-item-btn');
  if (saveMenuItemBtn) {
    saveMenuItemBtn.addEventListener('click', function() {
      saveMenuItemData();
    });
  }
  
  // Setup modal controls if not already done
  setupModalControls();
  
  // Load menu items when tab becomes active
  document.querySelector('.tab[data-tab="menu-management"]').addEventListener('click', function() {
    displayMenuItems();
  });
}

// Display menu items in the table
function displayMenuItems() {
  const menuTableBody = document.getElementById('menu-table-body');
  if (!menuTableBody) return;
  
  // Clear the table
  menuTableBody.innerHTML = '';
  
  // Fetch menu data from server
  fetch('/api/menu/items')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(menuItems => {
      // Add each menu item to the table
      menuItems.forEach(item => {
        const row = document.createElement('tr');
        
        // Format price
        const formattedPrice = new Intl.NumberFormat('vi-VN').format(item.price) + '₫';
        
        // Status badge
        const statusBadge = item.status === 'available' ? 
          '<span class="badge green small">Available</span>' : 
          '<span class="badge red small">Out of Stock</span>';
        
        row.innerHTML = `
          <td>${item.name}</td>
          <td>${item.description || '-'}</td>
          <td>${item.category ? item.category.name || item.category : '-'}</td>
          <td>${formattedPrice}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="icon-button edit-menu-btn" data-id="${item._id}">
              <i class="fas fa-edit"></i>
            </button>
          </td>
        `;
        
        menuTableBody.appendChild(row);
      });
      
      // Setup edit and delete buttons
      setupMenuButtons();
    })
    .catch(error => {
      console.error("Error fetching menu items:", error);
      menuTableBody.innerHTML = '<tr><td colspan="6">Error loading menu data. Please try again.</td></tr>';
    });
}

// Setup menu action buttons
function setupMenuButtons() {
  // Edit menu buttons
  const editButtons = document.querySelectorAll('.edit-menu-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.getAttribute('data-id');
      openMenuItemModal(itemId);
    });
  });
  
  // Delete menu buttons
  const deleteButtons = document.querySelectorAll('.delete-menu-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this menu item?')) {
        deleteMenuItem(itemId);
      }
    });
  });
}

// Open menu item modal
function openMenuItemModal(itemId = null) {
  // Reset form
  document.getElementById('menu-item-form').reset();
  
  const modalTitle = document.getElementById('menu-item-modal-title');
  
  // Load categories for dropdown
  loadCategories();
  
  if (itemId) {
    // Edit mode
    modalTitle.textContent = 'Edit Menu Item';
    
    // Fetch menu item data from server
    fetch(`/api/menu/items/${itemId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(item => {
        // Fill form with menu item data
        document.getElementById('menu-item-name').value = item.name || '';
        document.getElementById('menu-item-description').value = item.description || '';
        
        // Set category - wait for categories to load
        const categorySelect = document.getElementById('menu-item-category');
        const categoryInterval = setInterval(() => {
          if (categorySelect.options.length > 1) {
            clearInterval(categoryInterval);
            
            // Set category value - could be an ID or a string
            const categoryId = item.category._id || item.category;
            if (categorySelect.querySelector(`option[value="${categoryId}"]`)) {
              categorySelect.value = categoryId;
            } else {
              // If the exact category isn't found, try to find by name
              Array.from(categorySelect.options).forEach(option => {
                if (option.text.toLowerCase() === (item.category.name || '').toLowerCase()) {
                  categorySelect.value = option.value;
                }
              });
            }
          }
        }, 100);
        
        document.getElementById('menu-item-price').value = item.price || '';
        document.getElementById('menu-item-status').value = item.status || 'available';
        
        if (document.getElementById('menu-item-preparation-time')) {
          document.getElementById('menu-item-preparation-time').value = item.preparation_time || '';
        }
        
        // Store ID for later use
        document.getElementById('menu-item-form').setAttribute('data-id', itemId);
      })
      .catch(error => {
        console.error("Error loading menu item:", error);
        alert('Failed to load menu item data. Please try again.');
      });
  } else {
    // Add mode
    modalTitle.textContent = 'Add Menu Item';
    document.getElementById('menu-item-form').removeAttribute('data-id');
  }
  
  // Show modal
  showModal('menu-item-modal');
}

// Load categories for dropdown
function loadCategories() {
  const categorySelect = document.getElementById('menu-item-category');
  if (!categorySelect) return;
  
  // Clear existing options except for the first one
  while (categorySelect.options.length > 1) {
    categorySelect.remove(1);
  }
  
  // Fetch categories from server
  fetch('/api/menu/categories')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(categories => {
      // Add each category to the dropdown
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category._id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error("Error loading categories:", error);
      // Add some default categories as a fallback
      const defaultCategories = ['Soups', 'Appetizers', 'Main Courses', 'Desserts', 'Beverages'];
      defaultCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase().replace(/\s+/g, '-');
        option.textContent = category;
        categorySelect.appendChild(option);
      });
    });
}

// Save menu item data to MongoDB
function saveMenuItemData() {
  console.log("Save menu item button clicked");
  const form = document.getElementById('menu-item-form');
  
  // Basic validation
  if (!form.checkValidity()) {
    alert('Please fill all required fields.');
    return;
  }
  
  // Get form data
  const name = document.getElementById('menu-item-name').value;
  const categoryId = document.getElementById('menu-item-category').value;
  const price = parseFloat(document.getElementById('menu-item-price').value);
  const status = document.getElementById('menu-item-status').value;
  const description = document.getElementById('menu-item-description').value;
  const preparation_time = parseInt(document.getElementById('menu-item-preparation-time').value) || 0;
  
  // Prepare data for API call
  const menuItemData = {
    name,
    category: categoryId,
    price,
    status,
    description,
    preparation_time
  };
  
  const itemId = form.getAttribute('data-id');
  
  // API endpoint and method based on add/edit mode
  const url = itemId ? `/api/menu/items/${itemId}` : '/api/menu/items';
  const method = itemId ? 'PUT' : 'POST';
  
  console.log("Sending request to:", url);
  console.log("Request data:", menuItemData);
  
  // Make API call to save data
  fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(menuItemData)
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error('Network response was not ok: ' + text);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log("Success:", data);
      // Close modal and refresh list
      closeModal();
      displayMenuItems();
    })
    .catch(error => {
      console.error("Error saving menu item data:", error);
      alert('An error occurred while saving the menu item: ' + error.message);
    });
}

// Delete menu item from MongoDB
function deleteMenuItem(itemId) {
  // Make API call to delete menu item
  fetch(`/api/menu/items/${itemId}`, {
    method: 'DELETE'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Refresh list
      displayMenuItems();
    })
    .catch(error => {
      console.error("Error deleting menu item:", error);
      alert('An error occurred while deleting the menu item.');
    });
}

// Modal functions
function setupModalControls() {
  // Only setup if not already initialized
  if (document.querySelector('.modal-close.initialized')) {
    return;
  }

  // Close buttons
  const closeButtons = document.querySelectorAll('.modal-close, .modal-cancel-btn');
  closeButtons.forEach(button => {
    button.classList.add('initialized');
    button.addEventListener('click', function() {
      closeModal();
    });
  });
  
  // Close when clicking backdrop
  const modalBackdrop = document.getElementById('modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', function(event) {
      if (event.target === modalBackdrop) {
        closeModal();
      }
    });
  }
  
  // Close on Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
}

// Show a specific modal
function showModal(modalId) {
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modal = document.getElementById(modalId);
  
  if (modalBackdrop && modal) {
    // Hide all modals first
    document.querySelectorAll('.modal').forEach(m => {
      m.style.display = 'none';
    });
    
    // Show backdrop and specific modal
    modalBackdrop.style.display = 'flex';
    modal.style.display = 'block';
  }
}

// Close all modals
function closeModal() {
  const modalBackdrop = document.getElementById('modal-backdrop');
  
  if (modalBackdrop) {
    modalBackdrop.style.display = 'none';
    
    // Hide all modals
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
    });
  }
}
document.addEventListener('DOMContentLoaded', setupOrderRefresh);