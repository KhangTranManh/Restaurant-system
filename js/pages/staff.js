// DOM Elements for Staff Page
let tabButtons;
let tabContents;
let tablesGrid;
let selectedTableEl;
let tableNumberEl;
let customerViewBtn;

// State variables
let selectedTable = null;
let orders = [];

// Sample orders data
const sampleOrders = [
  {
    order_id: 1001,
    table_id: 2,
    table_number: 2,
    status: 'pending',
    created_at: new Date().toISOString(),
    items: [
      { order_item_id: 1, menu_item_id: 101, menu_item_name: 'Phở Bò', quantity: 2, item_price: 90000, special_instructions: 'Extra bean sprouts' },
      { order_item_id: 2, menu_item_id: 102, menu_item_name: 'Bún Chả', quantity: 1, item_price: 95000, special_instructions: '' },
      { order_item_id: 3, menu_item_id: 103, menu_item_name: 'Cà Phê Sữa Đá', quantity: 3, item_price: 25000, special_instructions: '' }
    ],
    total_amount: 350000
  },
  {
    order_id: 1002,
    table_id: 5,
    table_number: 5,
    status: 'preparing',
    created_at: new Date().toISOString(),
    items: [
      { order_item_id: 4, menu_item_id: 201, menu_item_name: 'Gỏi Cuốn', quantity: 1, item_price: 65000, special_instructions: '' },
      { order_item_id: 5, menu_item_id: 202, menu_item_name: 'Bánh Xèo', quantity: 1, item_price: 85000, special_instructions: 'No shrimp, extra vegetables' }
    ],
    total_amount: 150000
  },
  {
    order_id: 1003,
    table_id: 2,
    table_number: 2,
    status: 'ready',
    created_at: new Date().toISOString(),
    items: [
      { order_item_id: 6, menu_item_id: 301, menu_item_name: 'Chả Giò', quantity: 1, item_price: 75000, special_instructions: '' },
      { order_item_id: 7, menu_item_id: 302, menu_item_name: 'Bún Bò Huế', quantity: 1, item_price: 120000, special_instructions: 'Extra spicy' },
      { order_item_id: 8, menu_item_id: 303, menu_item_name: 'Nước Chanh Muối', quantity: 1, item_price: 35000, special_instructions: '' }
    ],
    total_amount: 230000
  },
  {
    order_id: 1000,
    table_id: 7,
    table_number: 7,
    status: 'delivered',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    delivered_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    items: [
      { order_item_id: 9, menu_item_id: 401, menu_item_name: 'Cà Phê Sữa Đá', quantity: 2, item_price: 25000, special_instructions: '' },
      { order_item_id: 10, menu_item_id: 402, menu_item_name: 'Bánh Mì Thịt', quantity: 1, item_price: 85000, special_instructions: '' }
    ],
    total_amount: 135000
  }
];

// Console log to verify script execution
console.log("Staff.js loaded");

// DOM content loaded handler
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded - Initializing staff page");
  setupKitchenIntegration();
  
  
  // Get DOM elements
  tabButtons = document.querySelectorAll('.tab');
  tabContents = document.querySelectorAll('.tab-content');
  tablesGrid = document.querySelector('.tables-grid');
  selectedTableEl = document.getElementById('selected-table');
  tableNumberEl = document.getElementById('staff-table-number');
  customerViewBtn = document.getElementById('customer-view-btn');
  
  // Check authentication
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  // If not logged in or not staff/admin, redirect to login
  if (!currentUser || (currentUser.role !== 'staff' && currentUser.role !== 'admin')) {
    window.location.href = 'login.html';
    return;
  }
  
  console.log(`Logged in as ${currentUser.name} (${currentUser.role})`);
  
  // Update user info in header
  const userInfoEl = document.getElementById('user-info');
  if (userInfoEl) {
    userInfoEl.textContent = `Welcome, ${currentUser.name}`;
  }
  
  // Check for new orders in local storage
  const newOrderStr = localStorage.getItem('newOrderForStaff');
  if (newOrderStr) {
    try {
      const newOrder = JSON.parse(newOrderStr);
      
      // Add to orders if not already present
      const existingOrder = sampleOrders.find(o => o.order_id === newOrder.order_id);
      if (!existingOrder) {
        sampleOrders.push(newOrder);
        
        // Remove the item from local storage to prevent duplicate processing
        localStorage.removeItem('newOrderForStaff');
      }
    } catch (error) {
      console.error("Error parsing new order:", error);
    }
  }
  
  // Load orders from sample data
  orders = sampleOrders;
  
  // Set up UI components
  setupTabs();
  setupTableSelection();
  setupEventListeners();
  
  // Check for a previously selected table in localStorage
  const savedTable = localStorage.getItem('selectedTable');
  if (savedTable) {
    console.log(`Found previously selected table: ${savedTable}`);
    selectTable(savedTable);
  } else {
    // By default, select table 2 (which is occupied in our example)
    selectTable(2);
  }

  // Listen for storage changes (new orders)
window.addEventListener('storage', function(event) {
  // Check for new order from customer or kitchen
  if (event.key === 'newOrderForStaff' || event.key === 'updatedOrderFromKitchen') {
    const newOrder = JSON.parse(event.newValue);
    console.log(`Received new ${event.key === 'newOrderForStaff' ? 'customer' : 'kitchen'} order in staff view`, newOrder);
    
    // Add to orders if it's not already there
    const existingOrder = orders.find(o => o.order_id === newOrder.order_id);
    if (!existingOrder) {
      orders.push(newOrder);
      sampleOrders.push(newOrder);
      
      // Refresh orders for the current table
      if (selectedTable) {
        fetchOrdersForTable(selectedTable);
      }
      
      // Update table status
      updateTableStatus();
    }
    
    // Remove the item from local storage
    localStorage.removeItem(event.key);
  }
});

// Direct table selection function
function selectTable(tableNumber) {
  console.log("Table " + tableNumber + " clicked");
  
  // Update the table buttons
  document.querySelectorAll('.tables-grid button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Set selected table button to active
  const tableBtn = document.getElementById(`table-${tableNumber}`);
  if (tableBtn) {
    tableBtn.classList.add('active');
  }
  
  // Update the selected table number
  if (tableNumberEl) {
    tableNumberEl.textContent = tableNumber;
  }
  
  // Show the selected table section
  if (selectedTableEl) {
    selectedTableEl.classList.remove('hidden');
  }
  
  // Save to localStorage
  localStorage.setItem('selectedTable', tableNumber);
  
  // Update selected table variable
  selectedTable = tableNumber.toString();
  
  // Update table details
  updateTableDetails(tableNumber);
  
  // Update orders for this table
  fetchOrdersForTable(tableNumber);
}

// Tab navigation functionality
function setupTabs() {
  console.log("Setting up tabs");
  if (!tabButtons || !tabContents) {
    console.error("Tab elements not found");
    return;
  }
  
  tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      
      // Update active tab
      tabButtons.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show selected tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
          content.classList.add('active');
        }
      });
    });
  });
}

// Table selection functionality
function setupTableSelection() {
  console.log("Setting up table selection");
  
  if (!tablesGrid) {
    console.error("Tables grid not found");
    return;
  }
  
  const tableButtons = tablesGrid.querySelectorAll('button');
  console.log(`Found ${tableButtons.length} table buttons`);
  
  tableButtons.forEach(tableBtn => {
    // Get the table number from data-table attribute or from the button text
    const tableNum = tableBtn.getAttribute('data-table') || tableBtn.textContent.trim();
    console.log(`Adding click event to table ${tableNum}`);
    
    // Add click event listener
    tableBtn.addEventListener('click', function() {
      selectTable(tableNum);
    });
  });
  
  // Update table status based on orders
  updateTableStatus();
}

// Setup additional event listeners
function setupEventListeners() {
  // Customer view button
  if (customerViewBtn) {
    customerViewBtn.addEventListener('click', function() {
      window.location.href = `customer.html?staff=true`;
    });
  }
  // Logout button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function() {
    // Clear user data from localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('selectedTable');
    
    // Redirect to login page
    window.location.href = 'login.html';
    
    console.log("User logged out");
  });
}
  
  // Mark as delivered buttons
  document.querySelectorAll('.mark-delivered').forEach(button => {
    button.addEventListener('click', function() {
      const orderId = this.dataset.id;
      markOrderAsDelivered(orderId);
    });
  });
}

// Update table status based on orders
function updateTableStatus() {
  console.log("Updating table status");
  
  if (!tablesGrid) {
    console.error("Tables grid not found");
    return;
  }
  
  const tableButtons = tablesGrid.querySelectorAll('button');
  
  // Reset all tables to default state
  tableButtons.forEach(btn => {
    btn.classList.remove('occupied', 'reserved');
  });
  
  // Set occupied tables based on orders
  orders.forEach(order => {
    if (order.status !== 'delivered' && order.status !== 'cancelled') {
      const tableBtn = document.getElementById(`table-${order.table_number}`);
      if (tableBtn) {
        tableBtn.classList.add('occupied');
      }
    }
  });
  
  // Set reserved tables (for demonstration)
  const tableBtn5 = document.getElementById('table-5');
  if (tableBtn5) {
    tableBtn5.classList.add('reserved');
  }
}

// Table detail functions
function updateTableDetails(tableNumber) {
  // This is a simulation - in real app, data would come from server
  const tableStatuses = {
    1: { status: 'available', since: '', guests: 0, order: null },
    2: { status: 'occupied', since: '12:15 PM', guests: 3, order: '1003' },
    3: { status: 'available', since: '', guests: 0, order: null },
    4: { status: 'available', since: '', guests: 0, order: null },
    5: { status: 'reserved', since: '', guests: 0, order: null, reservationTime: '1:30 PM' },
    6: { status: 'available', since: '', guests: 0, order: null },
    7: { status: 'available', since: '', guests: 0, order: null },
    8: { status: 'available', since: '', guests: 0, order: null },
  };
  
  // Check if table has an active order
  orders.forEach(order => {
    if (order.table_number == tableNumber && order.status !== 'delivered' && order.status !== 'cancelled') {
      tableStatuses[tableNumber].status = 'occupied';
      tableStatuses[tableNumber].order = order.order_id;
    }
  });
  
  const tableDetails = tableStatuses[tableNumber];
  if (!tableDetails) return;
  
  // Update table status badge
  const statusBadge = document.querySelector('.table-status-badge');
  if (statusBadge) {
    statusBadge.className = 'table-status-badge ' + tableDetails.status;
    statusBadge.textContent = tableDetails.status.charAt(0).toUpperCase() + tableDetails.status.slice(1);
  }
  
  // Update table details content
  const detailsContent = document.querySelector('.table-details-content');
  if (!detailsContent) return;
  
  if (tableDetails.status === 'occupied') {
    detailsContent.innerHTML = `
      <div><strong>Occupied since:</strong> ${tableDetails.since}</div>
      <div><strong>Guests:</strong> ${tableDetails.guests}</div>
      <div><strong>Current order:</strong> ${tableDetails.order ? `Order #${tableDetails.order} (Ready for service)` : 'No active order'}</div>
    `;
  } else if (tableDetails.status === 'reserved') {
    detailsContent.innerHTML = `
      <div><strong>Reserved for:</strong> ${tableDetails.reservationTime}</div>
      <div><strong>Expected guests:</strong> Unknown</div>
      <div><strong>Notes:</strong> Regular customer</div>
    `;
  } else {
    detailsContent.innerHTML = `
      <div><strong>Status:</strong> Available for seating</div>
      <div><strong>Last occupied:</strong> 10:30 AM</div>
    `;
  }
  
  // Update action buttons based on table status
  const actionButtons = document.querySelector('.table-action-buttons');
  if (!actionButtons) return;
  
  if (tableDetails.status === 'occupied') {
    actionButtons.innerHTML = `
      <button class="primary" onclick="createNewOrder(${tableNumber})">New Order</button>
      <button class="secondary" onclick="showBill(${tableNumber})">Bill</button>
    `;
  } else if (tableDetails.status === 'reserved') {
    actionButtons.innerHTML = `
      <button class="primary" onclick="seatGuests(${tableNumber})">Seat Guests</button>
      <button class="secondary" onclick="cancelReservation(${tableNumber})">Cancel Reservation</button>
    `;
  } else {
    actionButtons.innerHTML = `
      <button class="primary" onclick="seatGuests(${tableNumber})">Seat Guests</button>
      <button class="secondary" onclick="makeReservation(${tableNumber})">Make Reservation</button>
    `;
  }
}

// Fetch orders for a specific table
function fetchOrdersForTable(tableNumber) {
  // Convert to integer for comparison
  const tableNum = parseInt(tableNumber);
  
  console.log(`Fetching orders for table ${tableNum}`);
  
  // Filter orders for this table
  const tableOrders = orders.filter(order => order.table_number === tableNum);
  console.log(`Found ${tableOrders.length} orders for table ${tableNum}`);

  const uniqueOrderIds = new Set();

  
  // Update tabs with the orders, ensuring no duplicates
  updateActiveOrdersTab(tableOrders.filter(order => {
    if (uniqueOrderIds.has(order.order_id)) {
      return false;
    }
    uniqueOrderIds.add(order.order_id);
    return true;
  }));
  
  uniqueOrderIds.clear();
  updateReadyOrdersTab(tableOrders.filter(order => {
    if (uniqueOrderIds.has(order.order_id)) {
      return false;
    }
    uniqueOrderIds.add(order.order_id);
    return true;
  }));
  
  uniqueOrderIds.clear();
  updateCompletedOrdersTab(tableOrders.filter(order => {
    if (uniqueOrderIds.has(order.order_id)) {
      return false;
    }
    uniqueOrderIds.add(order.order_id);
    return true;
  }));
  
}

// Update the Active Orders tab
function updateActiveOrdersTab(tableOrders) {
  const activeOrders = tableOrders.filter(order => 
    order.status === 'pending' || order.status === 'preparing'
  );
  
  const staffActiveOrders = document.getElementById('staff-active-orders');
  const noActiveOrders = document.getElementById('no-active-orders');
  
  if (!staffActiveOrders || !noActiveOrders) {
    console.error("Active orders elements not found");
    return;
  }
  
  if (activeOrders.length === 0) {
    staffActiveOrders.innerHTML = '';
    noActiveOrders.classList.remove('hidden');
    return;
  }
  
  staffActiveOrders.innerHTML = '';
  noActiveOrders.classList.add('hidden');
  
  activeOrders.forEach(order => {
    renderActiveOrder(order, staffActiveOrders);
  });
}

// Update the Ready for Service tab
function updateReadyOrdersTab(tableOrders) {
  const readyOrders = tableOrders.filter(order => order.status === 'ready');
  
  const staffReadyOrders = document.getElementById('staff-ready-orders');
  const noReadyOrders = document.getElementById('no-ready-orders');
  
  if (!staffReadyOrders || !noReadyOrders) {
    console.error("Ready orders elements not found");
    return;
  }
  
  if (readyOrders.length === 0) {
    staffReadyOrders.innerHTML = '';
    noReadyOrders.classList.remove('hidden');
    return;
  }
  
  staffReadyOrders.innerHTML = '';
  noReadyOrders.classList.add('hidden');
  
  readyOrders.forEach(order => {
    renderReadyOrder(order, staffReadyOrders);
  });
}

// Update the Completed tab
function updateCompletedOrdersTab(tableOrders) {
  const completedOrders = tableOrders.filter(order => order.status === 'delivered');
  
  const staffCompletedOrders = document.getElementById('staff-completed-orders');
  const noCompletedOrders = document.getElementById('no-completed-orders');
  
  if (!staffCompletedOrders || !noCompletedOrders) {
    console.error("Completed orders elements not found");
    return;
  }
  
  if (completedOrders.length === 0) {
    staffCompletedOrders.innerHTML = '';
    noCompletedOrders.classList.remove('hidden');
    return;
  }
  
  staffCompletedOrders.innerHTML = '';
  noCompletedOrders.classList.add('hidden');
  
  completedOrders.forEach(order => {
    renderCompletedOrder(order, staffCompletedOrders);
  });
}

// Render a single active order
function renderActiveOrder(order, container) {
  const statusBadgeClass = order.status === 'pending' ? 'yellow' : 'blue';
  const statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);
  
  // Format the time
  const orderTime = new Date(order.created_at);
  const formattedTime = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const orderHTML = `
    <div class="staff-order-card">
      <div class="staff-order-header">
        <div class="staff-order-title">
          <span>Order #${order.order_id} - Table ${order.table_number}</span>
          <span class="badge ${statusBadgeClass}">${statusText}</span>
        </div>
        <div class="staff-order-time">${formattedTime}</div>
      </div>
      <div class="staff-order-content">
        <div class="staff-order-items">
          ${order.items.map(item => `
            <div class="staff-order-item">
              <div class="staff-order-item-name">
                <span class="staff-order-item-quantity">${item.quantity}x</span>
                ${item.menu_item_name}
                ${item.special_instructions ? `<span class="staff-order-item-notes">"${item.special_instructions}"</span>` : ''}
              </div>
              <span>${formatCurrency(item.item_price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="staff-order-footer">
        <div class="staff-order-total">
          Total: ${formatCurrency(order.total_amount)}
        </div>
        <div class="staff-order-action">
          <button class="secondary" disabled>
            <i class="fas fa-spinner fa-spin"></i> Kitchen Preparing
          </button>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML += orderHTML;
}
// Function to send new orders to the kitchen
function sendOrderToKitchen(order) {
  console.log(`Sending order #${order.order_id} to kitchen`);
  
  // Make sure the order has the required fields
  const kitchenOrder = {
    order_id: order.order_id,
    table_id: order.table_id,
    table_number: order.table_number,
    status: 'pending',
    created_at: order.created_at || new Date().toISOString(),
    items: order.items,
    total_amount: order.total_amount
  };
  
  // Store the order in localStorage for the kitchen to pick up
  try {
    localStorage.setItem('newOrderForKitchen', JSON.stringify(kitchenOrder));
    console.log('Order sent to kitchen successfully');
    return true;
  } catch (error) {
    console.error('Error sending order to kitchen:', error);
    return false;
  }
}

// Function to listen for updates from the kitchen
function setupKitchenIntegration() {
  // Listen for storage changes from kitchen
  window.addEventListener('storage', function(event) {
    // Check for updates from the kitchen
    if (event.key === 'updatedOrderFromKitchen') {
      try {
        const updatedOrder = JSON.parse(event.newValue);
        console.log('Received updated order from kitchen:', updatedOrder);
        
        // Find and update the order in our local array
        const orderIndex = orders.findIndex(o => o.order_id === updatedOrder.order_id);
        if (orderIndex >= 0) {
          orders[orderIndex].status = updatedOrder.status;
          
          // Refresh the display if this is for the selected table
          if (selectedTable && selectedTable.toString() === updatedOrder.table_number.toString()) {
            fetchOrdersForTable(selectedTable);
          }
          
          // Update table status
          updateTableStatus();
          
          // Remove from localStorage to prevent duplicate processing
          localStorage.removeItem('updatedOrderFromKitchen');
        }
      } catch (error) {
        console.error('Error processing kitchen update:', error);
      }
    }
  });
}

// Example of creating a new order and sending it to kitchen
function createOrder(tableNumber, menuItems) {
  // Generate a unique order ID (in a real app, this would come from the server)
  const orderId = Date.now();
  
  // Create the order object
  const newOrder = {
    order_id: orderId,
    table_id: tableNumber,
    table_number: parseInt(tableNumber),
    status: 'pending',
    created_at: new Date().toISOString(),
    items: menuItems.map(item => ({
      menu_item_id: item.id,
      menu_item_name: item.name,
      quantity: item.quantity,
      item_price: item.price,
      special_instructions: item.instructions || ''
    })),
    total_amount: menuItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  };
  
  // Add to local orders array
  orders.push(newOrder);
  
  // Send to kitchen
  sendOrderToKitchen(newOrder);
  
  // Refresh the table view if we're on the relevant table
  if (selectedTable && selectedTable.toString() === tableNumber.toString()) {
    fetchOrdersForTable(selectedTable);
  }
  
  // Update table status
  updateTableStatus();
  
  return orderId;
}

// Render a single ready order
function renderReadyOrder(order, container) {
  // Format the time
  const orderTime = new Date(order.created_at);
  const formattedTime = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const orderHTML = `
    <div class="staff-order-card">
      <div class="staff-order-header">
        <div class="staff-order-title">
          <span>Order #${order.order_id} - Table ${order.table_number}</span>
          <span class="badge green">Ready for Service</span>
        </div>
        <div class="staff-order-time">${formattedTime}</div>
      </div>
      <div class="staff-order-content">
        <div class="staff-order-items">
          ${order.items.map(item => `
            <div class="staff-order-item">
              <div class="staff-order-item-name">
                <span class="staff-order-item-quantity">${item.quantity}x</span>
                ${item.menu_item_name}
                ${item.special_instructions ? `<span class="staff-order-item-notes">"${item.special_instructions}"</span>` : ''}
              </div>
              <span>${formatCurrency(item.item_price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="staff-order-footer">
        <div class="staff-order-total">
          Total: ${formatCurrency(order.total_amount)}
        </div>
        <button class="primary mark-delivered" data-id="${order.order_id}">
          Mark as Delivered
        </button>
      </div>
    </div>
  `;
  
  container.innerHTML += orderHTML;
  
  // Add event listener to the new button
  setTimeout(() => {
    const newButton = container.querySelector(`.mark-delivered[data-id="${order.order_id}"]`);
    if (newButton) {
      newButton.addEventListener('click', function() {
        markOrderAsDelivered(order.order_id);
      });
    }
  }, 0);
}

// Render a single completed order
function renderCompletedOrder(order, container) {
  // Format the time
  const orderTime = new Date(order.created_at);
  const formattedTime = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  let deliveredTime = '';
  if (order.delivered_at) {
    const deliveredDate = new Date(order.delivered_at);
    deliveredTime = deliveredDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    deliveredTime = '12:05 PM'; // Fallback for demo
  }
  
  const orderHTML = `
    <div class="staff-order-card">
      <div class="staff-order-header">
        <div class="staff-order-title">
          <span>Order #${order.order_id} - Table ${order.table_number}</span>
          <span class="badge" style="background-color: #6b7280;">Completed</span>
        </div>
        <div class="staff-order-time">${formattedTime}</div>
      </div>
      <div class="staff-order-content">
        <div class="staff-order-items">
          ${order.items.map(item => `
            <div class="staff-order-item">
              <div class="staff-order-item-name">
                <span class="staff-order-item-quantity">${item.quantity}x</span>
                ${item.menu_item_name}
              </div>
              <span>${formatCurrency(item.item_price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="staff-order-footer">
        <div class="staff-order-total">
          Total: ${formatCurrency(order.total_amount)}
        </div>
        <div class="staff-order-action">
          <span style="color: #6b7280; font-weight: 500;">Delivered at ${deliveredTime}</span>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML += orderHTML;
}

// Table action functions
function createNewOrder(tableNumber) {
  // In a real implementation, this would either open a modal or
  // navigate to the customer view with the table pre-selected
  
  // For demonstration purposes, we'll redirect to customer view with table parameter
  window.location.href = `customer.html?table=${tableNumber}&staff=true`;
}

function showBill(tableNumber) {
  alert(`Showing bill for table ${tableNumber}`);
  // In a real app, this would display the bill in a modal
}

function seatGuests(tableNumber) {
  const tableBtn = document.getElementById(`table-${tableNumber}`);
  if (tableBtn) {
    tableBtn.classList.add('occupied');
    tableBtn.classList.remove('reserved');
  }
  selectTable(tableNumber);
  alert(`Guests seated at table ${tableNumber}`);
}

function makeReservation(tableNumber) {
  const tableBtn = document.getElementById(`table-${tableNumber}`);
  if (tableBtn) {
    tableBtn.classList.add('reserved');
  }
  selectTable(tableNumber);
  alert(`Reservation made for table ${tableNumber}`);
}

function cancelReservation(tableNumber) {
  const tableBtn = document.getElementById(`table-${tableNumber}`);
  if (tableBtn) {
    tableBtn.classList.remove('reserved');
  }
  selectTable(tableNumber);
  alert(`Reservation cancelled for table ${tableNumber}`);
}

function markOrderAsDelivered(orderId) {
  console.log(`Marking order ${orderId} as delivered`);
  
  // Update order status in our array
  const orderIndex = orders.findIndex(o => o.order_id == orderId);
  if (orderIndex >= 0) {
    orders[orderIndex].status = 'delivered';
    orders[orderIndex].delivered_at = new Date().toISOString();
    
    // Refresh the table orders
    if (selectedTable) {
      fetchOrdersForTable(selectedTable);
    }
    
    alert(`Order #${orderId} marked as delivered`);
  }
}

// Format currency in Vietnamese Dong
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

// For compatibility with HTML inline click handlers
window.selectTable = selectTable;
window.createNewOrder = createNewOrder;
window.showBill = showBill;
window.seatGuests = seatGuests;
window.makeReservation = makeReservation;
window.cancelReservation = cancelReservation;
});