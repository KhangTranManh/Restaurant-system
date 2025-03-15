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
// Console log to verify script execution
console.log("Staff.js loaded");

// DOM content loaded handler
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded - Initializing staff page");
  
  
  
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
  
  // Update selected table variable
  selectedTable = tableNumber.toString();
  
  // Update table details and orders
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

async function updateTableStatus() {
  console.log("Updating table status");
  
  if (!tablesGrid) {
    console.error("Tables grid not found");
    return;
  }
  
  try {
    // First, reset all tables to default state
    const tableButtons = tablesGrid.querySelectorAll('button');
    tableButtons.forEach(btn => {
      btn.classList.remove('occupied', 'reserved');
    });
    
    // Get fresh table data from API
    const response = await fetch('/api/tables');
    const tables = await response.json();
    
    // Also get active orders to double-check table status
    const ordersResponse = await fetch('/api/orders?status=pending&status=preparing&status=ready');
    const activeOrders = await ordersResponse.json();
    
    // Create a Set of table numbers that have active orders
    const tablesWithActiveOrders = new Set();
    activeOrders.forEach(order => {
      tablesWithActiveOrders.add(order.table_number);
    });
    
    // Set table statuses based on API data and active orders
    tables.forEach(table => {
      const tableBtn = document.getElementById(`table-${table.table_number}`);
      if (tableBtn) {
        if (tablesWithActiveOrders.has(table.table_number)) {
          // If table has active orders, mark as occupied regardless of what the table status says
          tableBtn.classList.add('occupied');
        } else if (table.status === 'occupied') {
          tableBtn.classList.add('occupied');
        } else if (table.status === 'reserved') {
          tableBtn.classList.add('reserved');
        }
      }
    });
  } catch (error) {
    console.error('Error updating table status:', error);
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
  // Ensure tableNumber is treated as a string
  tableNumber = tableNumber.toString();
  
  console.log(`Fetching orders for table ${tableNumber}`);
  
  // Filter orders for this table (using string comparison)
  const tableOrders = orders.filter(order => order.table_number.toString() === tableNumber);
  console.log(`Found ${tableOrders.length} orders for table ${tableNumber}`, tableOrders);

  // Get DOM elements
  const staffActiveOrders = document.getElementById('staff-active-orders');
  const noActiveOrders = document.getElementById('no-active-orders');
  const staffReadyOrders = document.getElementById('staff-ready-orders');
  const noReadyOrders = document.getElementById('no-ready-orders');
  const staffCompletedOrders = document.getElementById('staff-completed-orders');
  const noCompletedOrders = document.getElementById('no-completed-orders');
  
  // Use Sets to track order IDs and prevent duplicates
  const processedOrderIds = new Set();
  
  // Filter orders by status and deduplicate
  const activeOrders = tableOrders.filter(order => {
    if (processedOrderIds.has(order.order_id) || 
       (order.status !== 'pending' && order.status !== 'preparing')) {
      return false;
    }
    processedOrderIds.add(order.order_id);
    return true;
  });
  
  // Reset the set for the next category
  processedOrderIds.clear();
  
  const readyOrders = tableOrders.filter(order => {
    if (processedOrderIds.has(order.order_id) || order.status !== 'ready') {
      return false;
    }
    processedOrderIds.add(order.order_id);
    return true;
  });
  
  // Reset again
  processedOrderIds.clear();
  
  const completedOrders = tableOrders.filter(order => {
    if (processedOrderIds.has(order.order_id) || order.status !== 'delivered') {
      return false;
    }
    processedOrderIds.add(order.order_id);
    return true;
  });
  
  // Update Active Orders tab
  if (staffActiveOrders && noActiveOrders) {
    staffActiveOrders.innerHTML = '';
    
    if (activeOrders.length === 0) {
      noActiveOrders.classList.remove('hidden');
    } else {
      noActiveOrders.classList.add('hidden');
      activeOrders.forEach(order => {
        renderActiveOrder(order, staffActiveOrders);
      });
    }
  }
  
  // Update Ready Orders tab
  if (staffReadyOrders && noReadyOrders) {
    staffReadyOrders.innerHTML = '';
    
    if (readyOrders.length === 0) {
      noReadyOrders.classList.remove('hidden');
    } else {
      noReadyOrders.classList.add('hidden');
      readyOrders.forEach(order => {
        renderReadyOrder(order, staffReadyOrders);
      });
    }
  }
  
  // Update Completed Orders tab
  if (staffCompletedOrders && noCompletedOrders) {
    staffCompletedOrders.innerHTML = '';
    
    if (completedOrders.length === 0) {
      noCompletedOrders.classList.remove('hidden');
    } else {
      noCompletedOrders.classList.add('hidden');
      completedOrders.forEach(order => {
        renderCompletedOrder(order, staffCompletedOrders);
      });
    }
  }
  
  // Notify other views that a table has been selected
  
}

// Update the fetchOrdersForTable function
async function fetchOrdersForTable(tableNumber) {
  try {
    console.log(`Fetching orders for table ${tableNumber}`);
    
    // Make sure we're using the API endpoint correctly
    const response = await fetch(`/api/orders?table_id=${tableNumber}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch orders');
    }
    
    const tableOrders = await response.json();
    console.log(`Found ${tableOrders.length} orders for table ${tableNumber}`, tableOrders);
    
    // Update local orders array
    orders = tableOrders;
    
    // Update the three order tabs
    updateActiveOrdersTab(tableOrders);
    updateReadyOrdersTab(tableOrders);
    updateCompletedOrdersTab(tableOrders);
    
    // Update the table details
    updateTableDetails(tableNumber);
    
    // Store selected table locally
    selectedTable = tableNumber;
    localStorage.setItem('selectedTable', tableNumber);
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    alert('Failed to fetch orders for this table.');
  }
}

// Update the markOrderAsDelivered function
async function markOrderAsDelivered(orderId) {
  try {
    console.log(`Marking order ${orderId} as delivered`);
    
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'delivered' })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to mark order as delivered');
    }
    
    const updatedOrder = await response.json();
    
    // Update the local order in our orders array
    const orderIndex = orders.findIndex(o => o._id === orderId || o.order_id === orderId);
    if (orderIndex !== -1) {
      orders[orderIndex] = updatedOrder;
    }
    
    // Refresh the table view
    if (selectedTable) {
      fetchOrdersForTable(selectedTable);
    }
    
    alert(`Order #${orderId} marked as delivered`);
    updateTableStatus();

  } catch (error) {
    console.error('Error marking order as delivered:', error);
    alert('Failed to mark order as delivered');
  }
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
  
  // Refresh the table view if we're on the relevant table
  if (selectedTable && selectedTable.toString() === tableNumber.toString()) {
    fetchOrdersForTable(selectedTable);
  }
  
  // Update table status
  updateTableStatus();

  setInterval(updateTableStatus, 60000);

  
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
    
    // Share updated orders with admin
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
