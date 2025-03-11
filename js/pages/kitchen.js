// kitchen.js - Kitchen dashboard functionality

// Sample orders array for local state management
let sampleOrders = [];

// DOM Elements for Admin Page (only used if in admin mode)
let adminStaffBtn;
let adminKitchenBtn;
let adminAnalyticsBtn;
let adminStaffView;
let adminKitchenView;
let adminAnalyticsView;

// Check authentication and initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
  console.log("Kitchen page loaded");
  setupStorageListener();
  checkForNewOrdersFromStaff();

  
  // Check authentication
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  // If not logged in or not kitchen staff/admin, redirect to login
  if (!currentUser || (currentUser.role !== 'kitchen' && currentUser.role !== 'admin')) {
    window.location.href = '/views/login.html';
    return;
  }
  
  console.log(`Logged in as ${currentUser.name} (${currentUser.role})`);
  
  // Update user info
  const userInfoEl = document.getElementById('user-info');
  if (userInfoEl) {
    userInfoEl.textContent = `Welcome, ${currentUser.name}`;
  }
  
  // Initialize admin-specific elements if in admin mode
  if (currentUser.role === 'admin') {
    initializeAdminElements();
  }
  
  // Setup common kitchen functionality
  setupKitchenFunctionality();
  
  // Initialize real-time updates
  initializeRealTimeUpdates();
});

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
      // Clear user data
      localStorage.removeItem('currentUser');
      // Use absolute path to ensure correct navigation
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

// Function to initialize real-time updates
function initializeRealTimeUpdates() {
  console.log("Setting up real-time updates");
  
  // Listen for storage events to update orders
  window.addEventListener('storage', function(event) {
    // Check for new order from another view
    const newOrderStr = localStorage.getItem('newOrderForStaff');
    if (newOrderStr) {
      try {
        const newOrder = JSON.parse(newOrderStr);
        
        // Add to sample orders if not already present
        const existingOrder = sampleOrders.find(o => o.order_id === newOrder.order_id);
        if (!existingOrder) {
          sampleOrders.push(newOrder);
          
          // Add to pending orders in the kitchen view
          addOrderToKitchenView(newOrder);
          
          // Update dashboard stats
          const pendingCountEl = document.querySelector('.dashboard-stats .stat-card:first-child .stat-value');
          if (pendingCountEl) {
            pendingCountEl.textContent = parseInt(pendingCountEl.textContent) + 1;
          }
          
          // Remove the item from local storage
          localStorage.removeItem('newOrderForStaff');
        }
      } catch (error) {
        console.error("Error parsing new order:", error);
      }
    }
  });
}

// Add a new order to the kitchen view
function addOrderToKitchenView(order) {
  console.log("Adding new order to kitchen view:", order);
  
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
        <span>Order #${order.order_id}</span>
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
      <button class="primary start-cooking" data-id="${order.order_id}">Start Preparing</button>
    </div>
  `;
  
  // Add order card to pending orders container
  pendingOrdersContainer.appendChild(orderCard);
  
  // Add event listener to the new start cooking button
  const startCookingBtn = orderCard.querySelector('.start-cooking');
  if (startCookingBtn) {
    startCookingBtn.addEventListener('click', function() {
      const orderId = this.dataset.id;
      alert(`Started preparation for Order #${orderId}`);
      
      // Hide the card
      this.closest('.kitchen-order-card').style.display = 'none';
      
      // Check remaining orders
      const remainingOrders = document.querySelectorAll('#kitchen-pending-orders .kitchen-order-card:not([style="display: none;"])').length;
      if (remainingOrders === 0 && noOrdersMessage) {
        noOrdersMessage.classList.remove('hidden');
      }
      
      // Update dashboard stats
      const pendingCountEl = document.querySelector('.dashboard-stats .stat-card:first-child .stat-value');
      const preparingCountEl = document.querySelector('.dashboard-stats .stat-card:nth-child(2) .stat-value');
      
      if (pendingCountEl) {
        pendingCountEl.textContent = parseInt(pendingCountEl.textContent) - 1;
      }
      
      if (preparingCountEl) {
        preparingCountEl.textContent = parseInt(preparingCountEl.textContent) + 1;
      }
      
      // Update order status
      updateOrderStatus(orderId, 'preparing');
      
      // Move order to preparation tab
      moveOrderToPreparation(orderId);
    });
  }
}

// Function to move an order from New Orders to In Preparation tab
function moveOrderToPreparation(orderId) {
  // Find the order data
  const order = sampleOrders.find(o => o.order_id.toString() === orderId.toString());
  if (!order) {
    console.error(`Order #${orderId} not found in sampleOrders`);
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
        <span>Order #${order.order_id}</span>
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
      <button class="primary complete-cooking" data-id="${order.order_id}">Mark as Ready</button>
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
        const orderId = this.dataset.id;
        completeCooking(orderId);
        
        // Remove this card from the In Preparation tab
        this.closest('.kitchen-order-card').remove();
        
        // Check if there are any orders left
        if (preparingContainer.querySelectorAll('.kitchen-order-card').length === 0 && noPreparingOrders) {
          noPreparingOrders.classList.remove('hidden');
        }
      });
    }
  }
}

// Start cooking an order
function startCooking(orderId) {
  console.log(`Starting cooking for order ${orderId}`);
  
  // Find the order
  const orderIndex = sampleOrders.findIndex(o => o.order_id.toString() === orderId.toString());
  if (orderIndex === -1) return;
  
  // Update order status
  sampleOrders[orderIndex].status = 'preparing';
  sampleOrders[orderIndex].prep_start_time = new Date().toISOString();
  
  // Mark all items as preparing
  sampleOrders[orderIndex].items.forEach(item => {
    item.status = 'preparing';
  });
  
  // Save updated orders
  localStorage.setItem('kitchenOrders', JSON.stringify(sampleOrders));
  
  // Notify staff of status change
  notifyStaffOfStatusChange(sampleOrders[orderIndex]);
  
  // Move the order card to the In Preparation tab
  moveOrderToPreparation(orderId);
}

// Complete cooking an order
function completeCooking(orderId) {
  console.log(`Completing cooking for order ${orderId}`);
  
  // Find the order
  const orderIndex = sampleOrders.findIndex(o => o.order_id.toString() === orderId.toString());
  if (orderIndex === -1) return;
  
  // Update order status
  sampleOrders[orderIndex].status = 'ready';
  sampleOrders[orderIndex].ready_at = new Date().toISOString();
  
  // Mark all items as ready
  sampleOrders[orderIndex].items.forEach(item => {
    item.status = 'ready';
  });
  
  // Save updated orders
  localStorage.setItem('kitchenOrders', JSON.stringify(sampleOrders));
  
  // Notify staff of status change
  notifyStaffOfStatusChange(sampleOrders[orderIndex]);
  
  // Refresh displays
  refreshAllTabs();
  
  // Move the order to Completed Today tab
  moveOrderToCompleted(orderId);
}

// Notify staff of order status change
function notifyStaffOfStatusChange(order) {
  try {
    // Store the updated order in localStorage for staff to pick up
    localStorage.setItem('updatedOrderFromKitchen', JSON.stringify(order));
  } catch (error) {
    console.error('Error notifying staff of status change:', error);
  }
}

// Check for new orders from staff
function checkForNewOrdersFromStaff() {
  const newOrderStr = localStorage.getItem('newOrderForKitchen');
  if (newOrderStr) {
    try {
      const newOrder = JSON.parse(newOrderStr);
      console.log('New order from staff:', newOrder);
      
      // Check if this order is already in our list
      const existingOrder = sampleOrders.find(o => o.order_id === newOrder.order_id);
      if (!existingOrder) {
        // Add the new order
        sampleOrders.push(newOrder);
        
        // Remove from localStorage to prevent duplicate processing
        localStorage.removeItem('newOrderForKitchen');
        
        // Save updated orders
        localStorage.setItem('kitchenOrders', JSON.stringify(sampleOrders));
        
        // Refresh displays
        refreshAllTabs();
      }
    } catch (error) {
      console.error('Error processing new order:', error);
    }
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

// Handle localStorage changes
function handleStorageChange(event) {
  if (event.key === 'newOrderForKitchen') {
    console.log('New order detected in localStorage');
    checkForNewOrdersFromStaff();
  }
}

// Listen for storage events
function setupStorageListener() {
  window.addEventListener('storage', handleStorageChange);
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

// Modify existing order action buttons to update order status and sync with staff
function setupOrderButtons() {
  console.log("Setting up admin order buttons");
  
  // Kitchen action buttons for pending orders
  document.querySelectorAll('.start-cooking').forEach(button => {
    button.addEventListener('click', function() {
      const orderCard = this.closest('.kitchen-order-card');
      const orderId = this.dataset.id;
      
      // Update order status to 'preparing'
      updateOrderStatus(orderId, 'preparing');
      
      // Rest of the functionality is handled by the common event handler
    });
  });
  
  // Kitchen action buttons for preparing orders
  document.querySelectorAll('.complete-cooking').forEach(button => {
    button.addEventListener('click', function() {
      const orderCard = this.closest('.kitchen-order-card');
      const orderId = this.dataset.id;
      
      // Update order status to 'ready'
      updateOrderStatus(orderId, 'ready');
      
      // Rest of the functionality is handled by the common event handler
    });
  });
}

// Update order status and sync with staff view
function updateOrderStatus(orderId, newStatus) {
  console.log(`Updating order #${orderId} status to ${newStatus}`);
  
  // Find the order in sample orders
  const orderIndex = sampleOrders.findIndex(o => o.order_id == orderId);
  
  if (orderIndex >= 0) {
    // Update order status
    sampleOrders[orderIndex].status = newStatus;
    
    // Store updated order in localStorage for staff view
    localStorage.setItem('updatedOrderFromKitchen', JSON.stringify(sampleOrders[orderIndex]));
    
    // Trigger storage event to notify other views
    window.dispatchEvent(new Event('storage'));
    
    return sampleOrders[orderIndex];
  } else {
    console.warn(`Order #${orderId} not found in sample orders`);
  }
  
  return null;
}

// Update dashboard statistics
function updateDashboardStats(fromTab, toTab) {
  console.log(`Updating dashboard stats: ${fromTab} -> ${toTab}`);
  
  try {
    // Decrement count for the 'from' tab
    const fromStatCard = document.querySelector(`.dashboard-stats .stat-card:contains(${fromTab})`);
    if (fromStatCard) {
      const fromCountEl = fromStatCard.querySelector('.stat-value');
      let fromCount = parseInt(fromCountEl.textContent);
      fromCountEl.textContent = Math.max(0, fromCount - 1);
    }
    
    // Increment count for the 'to' tab
    const toStatCard = document.querySelector(`.dashboard-stats .stat-card:contains(${toTab})`);
    if (toStatCard) {
      const toCountEl = toStatCard.querySelector('.stat-value');
      let toCount = parseInt(toCountEl.textContent);
      toCountEl.textContent = toCount + 1;
    }
  } catch (error) {
    console.error("Error updating dashboard stats:", error);
  }
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