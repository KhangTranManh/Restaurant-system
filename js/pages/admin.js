/// Single combined DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
  console.log("Admin page loaded");
  loadDashboardStats();
  
  // Initialize the analytics dashboard
  initializeAnalyticsDashboard();
  initializePerformanceMetrics();

  
  // Set up analytics refresh functionality
  setupAnalyticsRefresh();

  const socket = io(); // Connect to Socket.IO server
  // Add event listeners for real-time updates
  socket.on('orderStatusChanged', function(statusUpdateData) {
    console.log('Received order status update via socket:', statusUpdateData);
    updateAdminTableStatus();
    
    // Refresh popup if open
    const popup = document.getElementById('table-popup');
    if (popup) {
      const tableNum = popup.getAttribute('data-table');
      closePopup();
      setTimeout(() => showTableOrderPopup(tableNum), 100);
    }
    loadActiveOrders();
  });
  
  // Additional socket events
  socket.on('newOrder', function(order) {
    console.log('New order received:', order);
    loadDashboardStats();
    loadTableData();
    loadActiveOrders();
    // Refresh analytics data when new order comes in
    if (!document.getElementById('admin-analytics-view').classList.contains('hidden')) {
      initializeAnalyticsDashboard();
    }
  });
  socket.emit('join', { role: 'admin' });
  socket.emit('joinStaff');
  
  socket.on('tableStatusChanged', function(tableData) {
    console.log('Table status changed:', tableData);
    updateAdminTableStatus();
  });
  
  // Logout button functionality
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      // Clear user data and authentication tokens
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      
      // Redirect to login page
      window.location.href = 'login.html';
    });
  } else {
    console.error("Logout button not found");
  }
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser && currentUser.role === 'admin') {
    socket.emit('join', { role: 'admin' });
    socket.emit('joinStaff'); // Admin should see staff updates too
  }
  
  // If not logged in or not admin, redirect to login
  if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = 'login.html';
    return;
  }
  
  console.log(`Logged in as ${currentUser.name} (${currentUser.role})`);
  
  // Update user info in header
  const userInfoEl = document.getElementById('user-info');
  if (userInfoEl) {
    userInfoEl.textContent = `Welcome, ${currentUser.name}`;
  }
  
  // Setup functions
  setupTabButtons();
  setupTableButtons();
  setupManagementButtonsAndSections();
  setupAutoRefresh();
  
  // Add event listener for analytics tab button
  const analyticsBtn = document.getElementById('admin-analytics-btn');
  if (analyticsBtn) {
    analyticsBtn.addEventListener('click', function() {
      setTimeout(fixRevenueChart, 300);

      // Hide other views
      document.querySelectorAll('.admin-panel').forEach(panel => {
        panel.style.display = 'none';
        panel.classList.add('hidden');
    

      });
      
      
      // Show analytics view
      const analyticsView = document.getElementById('admin-analytics-view');
      if (analyticsView) {
        analyticsView.style.display = 'block';
        analyticsView.classList.remove('hidden');
        
        // Refresh analytics data
        initializeAnalyticsDashboard();
      }
      
      // Update button styles
      document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('primary');
        btn.classList.add('secondary');
      });
      analyticsBtn.classList.add('primary');
      analyticsBtn.classList.remove('secondary');
    });
  }
  
  // First hide the management view
  const adminManagementView = document.getElementById('admin-management-view');
  if (adminManagementView) {
    adminManagementView.style.display = 'none';
    adminManagementView.classList.add('hidden');
  }
  
  // Hide analytics view initially
  const adminAnalyticsView = document.getElementById('admin-analytics-view');
  if (adminAnalyticsView) {
    adminAnalyticsView.style.display = 'none';
    adminAnalyticsView.classList.add('hidden');
  }
  
  // Hide all management sections
  const managementSections = document.querySelectorAll('.management-section');
  managementSections.forEach(section => {
    section.style.display = 'none';
    section.classList.add('hidden');
  });
  
  // Hide bottom dashboard grid with management cards
  const bottomGrid = document.querySelector('.dashboard-grid:last-of-type');
  if (bottomGrid) {
    bottomGrid.style.display = 'none';
  }
  
  // Show Staff View as default
  const adminStaffView = document.getElementById('admin-staff-view');
  if (adminStaffView) {
    adminStaffView.style.display = 'block';
    adminStaffView.classList.remove('hidden');
  }
  
  // Update button styles to highlight Staff View button
  const adminStaffBtn = document.getElementById('admin-staff-btn');
  if (adminStaffBtn) {
    adminStaffBtn.classList.add('primary');
    adminStaffBtn.classList.remove('secondary');
  }
  
  const adminManagementBtn = document.getElementById('admin-management-btn');
  if (adminManagementBtn) {
    adminManagementBtn.classList.remove('primary');
    adminManagementBtn.classList.add('secondary');
  }
  
  // Create a direct link to the staff orders if possible
  if (window.opener && window.opener.orders) {
    console.log("Found staff orders through window.opener");
    window.orders = window.opener.orders;
  }
  
  // Listen for storage events from staff.js
  window.addEventListener('storage', function(event) {
    if (event.key === 'staffOrders' || event.key === 'selectedTable') {
      console.log("Storage event detected:", event.key);
      updateAdminTableStatus();
      
      // Update popup if it's open
      const popup = document.getElementById('table-popup');
      if (popup) {
        const tableNum = popup.getAttribute('data-table');
        closePopup();
        setTimeout(() => showTableOrderPopup(tableNum), 100);
      }
    }
  });
  
  // Load initial dashboard stats from database
  loadDashboardStats();
  loadTableData();
  updateAdminTableStatus();
  
  // Set up auto-refresh for dashboard stats
  setInterval(() => {
    if (!document.getElementById('admin-staff-view').classList.contains('hidden')) {
      loadDashboardStats();
      loadTableData();
    }
    // Also refresh analytics data if analytics view is visible
    if (!document.getElementById('admin-analytics-view').classList.contains('hidden')) {
      initializeAnalyticsDashboard();
    }
  }, 30000); // Refresh every 30 seconds
  setupOrderRefresh();
});

// Add this to your admin.js file
function setupTabButtons() {
  console.log("Setting up admin tab buttons");
  
  // DOM Elements for Admin Page
  const adminStaffBtn = document.getElementById('admin-staff-btn');
  const adminKitchenBtn = document.getElementById('admin-kitchen-btn');
  const adminAnalyticsBtn = document.getElementById('admin-analytics-btn');
  const adminManagementBtn = document.getElementById('admin-management-btn');
  
  const adminStaffView = document.getElementById('admin-staff-view');
  const adminKitchenView = document.getElementById('admin-kitchen-view');
  const adminAnalyticsView = document.getElementById('admin-analytics-view');
  const adminManagementView = document.getElementById('admin-management-view');
  
  // Hide ALL management sections when switching to any non-management view
  function hideAllManagementSections() {
    // Hide main management view
    if (adminManagementView) adminManagementView.classList.add('hidden');
    
    // Hide all management sub-sections
    const managementSections = document.querySelectorAll('.management-section');
    managementSections.forEach(section => {
      section.classList.add('hidden');
    });
  }
  
 
adminStaffBtn.addEventListener('click', function() {
  // Hide all management sections
  hideAllManagementSections();
  
  // Update button styles
  adminStaffBtn.classList.add('primary');
  adminStaffBtn.classList.remove('secondary');
  adminKitchenBtn.classList.add('secondary');
  adminKitchenBtn.classList.remove('primary');
  adminAnalyticsBtn.classList.add('secondary');
  adminAnalyticsBtn.classList.remove('primary');
  adminManagementBtn.classList.add('secondary');
  adminManagementBtn.classList.remove('primary');
  
  // Show staff view, hide others
  adminStaffView.classList.remove('hidden');
  adminKitchenView.classList.add('hidden');
  adminAnalyticsView.classList.add('hidden');
  
  // Load real-time data from the database
  loadDashboardStats();
  loadTableData();
});
  
  // Apply the same pattern to other view buttons
  adminKitchenBtn.addEventListener('click', function() {
    hideAllManagementSections();
    
    // Update button styles
    adminKitchenBtn.classList.add('primary');
    adminKitchenBtn.classList.remove('secondary');
    adminStaffBtn.classList.add('secondary');
    adminStaffBtn.classList.remove('primary');
    adminAnalyticsBtn.classList.add('secondary');
    adminAnalyticsBtn.classList.remove('primary');
    adminManagementBtn.classList.add('secondary');
    adminManagementBtn.classList.remove('primary');
    
    // Show kitchen view, hide others
    adminKitchenView.classList.remove('hidden');
    adminStaffView.classList.add('hidden');
    adminAnalyticsView.classList.add('hidden');
  });
  
  adminAnalyticsBtn.addEventListener('click', function() {
    hideAllManagementSections();
    
    // Update button styles
    adminAnalyticsBtn.classList.add('primary');
    adminAnalyticsBtn.classList.remove('secondary');
    adminStaffBtn.classList.add('secondary');
    adminStaffBtn.classList.remove('primary');
    adminKitchenBtn.classList.add('secondary');
    adminKitchenBtn.classList.remove('primary');
    adminManagementBtn.classList.add('secondary');
    adminManagementBtn.classList.remove('primary');
    
    // Show analytics view, hide others
    adminAnalyticsView.classList.remove('hidden');
    adminStaffView.classList.add('hidden');
    adminKitchenView.classList.add('hidden');
  });
  
  adminManagementBtn.addEventListener('click', function() {
    // Hide all management sections except the main view
    const managementSections = document.querySelectorAll('.management-section');
    managementSections.forEach(section => {
      section.classList.add('hidden');
    });
    
    // Update button styles
    adminManagementBtn.classList.add('primary');
    adminManagementBtn.classList.remove('secondary');
    adminStaffBtn.classList.add('secondary');
    adminStaffBtn.classList.remove('primary');
    adminKitchenBtn.classList.add('secondary');
    adminKitchenBtn.classList.remove('primary');
    adminAnalyticsBtn.classList.add('secondary');
    adminAnalyticsBtn.classList.remove('primary');
    
    // Show management view, hide others
    adminManagementView.classList.remove('hidden');
    adminStaffView.classList.add('hidden');
    adminKitchenView.classList.add('hidden');
    adminAnalyticsView.classList.add('hidden');
    
    // Load dashboard stats for management
    if (typeof loadDashboardStats === 'function') {
      loadDashboardStats();
    }
  });
}
function loadDashboardStats() {
  console.log('Loading dashboard stats...');

  // Helper function for error handling
  const handleFetchError = (endpoint) => (error) => {
    console.error(`Error loading ${endpoint} stats:`, error);
    
    // Optionally update UI to show error state
    try {
      switch(endpoint) {
        case 'tables':
          document.getElementById('available-tables-count').textContent = 'N/A';
          document.getElementById('occupied-tables-count').textContent = 'N/A';
          break;
        case 'orders':
          document.getElementById('active-orders-count').textContent = 'N/A';
          document.getElementById('completed-today-count').textContent = 'N/A';
          break;
        case 'revenue':
          const todayRevenueElement = document.getElementById('today-revenue');
          const weekRevenueElement = document.getElementById('week-revenue');
          
          if (todayRevenueElement) {
            todayRevenueElement.textContent = 'Error';
            todayRevenueElement.style.color = 'red';
          }
          
          if (weekRevenueElement) {
            weekRevenueElement.textContent = 'Error';
            weekRevenueElement.style.color = 'red';
          }
          break;
        case 'staff':
          document.getElementById('on-duty-count').textContent = 'N/A';
          document.getElementById('kitchen-staff-count').textContent = 'N/A';
          break;
      }
    } catch (uiError) {
      console.error('Error updating UI:', uiError);
    }
  };

  // Helper function to format revenue
  const formatRevenue = (amount) => {
    // Convert to millions and round to 1 decimal place
    const formattedAmount = (amount / 1000000).toFixed(1);
    return `${formattedAmount}M₫`;
  };

  // Tables stats
  fetch('/api/tables/stats')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      document.getElementById('available-tables-count').textContent = data.available || 0;
      document.getElementById('occupied-tables-count').textContent = data.occupied || 0;
    })
    .catch(handleFetchError('tables'));

  // Orders stats
  fetch('/api/orders/stats')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      document.getElementById('active-orders-count').textContent = data.active || 0;
      document.getElementById('completed-today-count').textContent = data.completedToday || 0;
    })
    .catch(handleFetchError('orders'));

  // Revenue stats
  fetch('/api/orders/revenue')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Detailed logging for debugging
      console.log('Revenue Data Received:', data);

      // Update revenue elements
      const todayRevenueElement = document.getElementById('today-revenue');
      const weekRevenueElement = document.getElementById('week-revenue');

      if (todayRevenueElement) {
        todayRevenueElement.textContent = formatRevenue(data.today);
        todayRevenueElement.style.color = ''; // Reset any previous error styling
      }

      if (weekRevenueElement) {
        weekRevenueElement.textContent = formatRevenue(data.week);
        weekRevenueElement.style.color = ''; // Reset any previous error styling
      }

      // Log formatted revenues
      console.log(`Today's Revenue: ${formatRevenue(data.today)}`);
      console.log(`This Week's Revenue: ${formatRevenue(data.week)}`);
    })
    .catch(handleFetchError('revenue'));

  // Staff stats
  fetch('/api/users/stats')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      document.getElementById('on-duty-count').textContent = data.onDuty || 0;
      document.getElementById('kitchen-staff-count').textContent = data.kitchenStaff || 0;
    })
    .catch(handleFetchError('staff'));
}

// Automatically load stats when page loads
document.addEventListener('DOMContentLoaded', loadDashboardStats);

// Optional: Add a manual refresh button functionality
function setupStatsRefresh() {
  const refreshButton = document.getElementById('refresh-stats-btn');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      console.log('Manually refreshing dashboard stats...');
      loadDashboardStats();
    });
  }
}
// Add this function to load real-time table data
async function loadTableData() {
  try {
    const response = await fetch('/api/tables');
    if (response.ok) {
      const tables = await response.json();
      
      // Clear existing table status classes
      const tableButtons = document.querySelectorAll('.tables-grid button');
      tableButtons.forEach(button => {
        button.classList.remove('occupied', 'reserved');
      });
      
      // Update table status based on database data
      tables.forEach(table => {
        const tableButton = document.getElementById(`table-${table.table_number}`);
        if (tableButton) {
          // Apply appropriate class based on table status
          if (table.status === 'occupied') {
            tableButton.classList.add('occupied');
          } else if (table.status === 'reserved') {
            tableButton.classList.add('reserved');
          }
        }
      });
    }
  } catch (error) {
    console.error('Error loading table data:', error);
  }
}
// NEW FUNCTION: Add management button functionality
function setupManagementButtonsAndSections() {
  console.log("Setting up management buttons");
  
  // Find all management buttons by ID or text content
  const manageStaffBtn = document.querySelector('#manage-staff-btn, button:contains("Manage Staff")');
  const manageMenuBtn = document.querySelector('#manage-menu-btn, button:contains("Manage Menu")');
  const manageUsersBtn = document.querySelector('#manage-users-btn, button:contains("Manage Users")');
  const settingsBtn = document.querySelector('#settings-btn, button:contains("Settings")');
  
  // Function to show Staff Management
  function showStaffManagement() {
    console.log("Showing Staff Management section");
    
    // Hide the main management view
    const adminManagementView = document.getElementById('admin-management-view');
    if (adminManagementView) {
      adminManagementView.style.display = 'none';
    }
    
    // Hide all dashboard grids
    const dashboardGrids = document.querySelectorAll('.dashboard-grid');
    dashboardGrids.forEach(grid => {
      grid.style.display = 'none';
    });
    
    // Try to find an existing staff management section
    let staffSection = document.querySelector('#staff-management-section');
    
    // If it doesn't exist, create it
    if (!staffSection) {
      staffSection = document.createElement('div');
      staffSection.id = 'staff-management-section';
      staffSection.className = 'management-section';
      staffSection.innerHTML = `
        <h3>Staff Management</h3>
        <button id="add-staff-btn" class="primary">+ Add Staff</button>
        
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Staff User</td>
              <td>Staff</td>
              <td>N/A</td>
              <td><span class="badge green">Active</span></td>
              <td>
                <button class="icon-button">✏️</button>
                <button class="icon-button">🗑️</button>
              </td>
            </tr>
            <tr>
              <td>Kitchen User</td>
              <td>Kitchen</td>
              <td>N/A</td>
              <td><span class="badge green">Active</span></td>
              <td>
                <button class="icon-button">✏️</button>
                <button class="icon-button">🗑️</button>
              </td>
            </tr>
            <tr>
              <td>Admin User</td>
              <td>Admin</td>
              <td>N/A</td>
              <td><span class="badge green">Active</span></td>
              <td>
                <button class="icon-button">✏️</button>
                <button class="icon-button">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <button id="back-to-management-btn" class="secondary">Back to Management</button>
      `;
      
      // Add it to the page
      const container = document.querySelector('.container, main');
      if (container) {
        container.appendChild(staffSection);
      } else {
        document.body.appendChild(staffSection);
      }
      
      // Add back button functionality
      const backBtn = staffSection.querySelector('#back-to-management-btn');
      if (backBtn) {
        backBtn.addEventListener('click', backToManagement);
      }
    }
    
    // Show the staff section
    staffSection.style.display = 'block';
  }
  
  // Function to show Menu Management (similar structure)
  function showMenuManagement() {
    console.log("Showing Menu Management section");
    
    // Hide the main management view
    const adminManagementView = document.getElementById('admin-management-view');
    if (adminManagementView) {
      adminManagementView.style.display = 'none';
    }
    
    // Hide all dashboard grids
    const dashboardGrids = document.querySelectorAll('.dashboard-grid');
    dashboardGrids.forEach(grid => {
      grid.style.display = 'none';
    });
    
    // Create or show menu management section (similar to staff management)
    // ...
  }
  
  // Function to show User Management (similar structure)
  function showUserManagement() {
    console.log("Showing User Management section");
    // Similar implementation to showStaffManagement
  }
  
  // Function to show Settings (similar structure)
  function showSettings() {
    console.log("Showing Settings section");
    // Similar implementation to showStaffManagement
  }
  
  // Function to go back to the main management dashboard
  function backToManagement() {
    console.log("Going back to Management Dashboard");
    
    // Hide all management sections
    const managementSections = document.querySelectorAll('.management-section');
    managementSections.forEach(section => {
      section.style.display = 'none';
    });
    
    // Show the main management view
    const adminManagementView = document.getElementById('admin-management-view');
    if (adminManagementView) {
      adminManagementView.style.display = 'block';
    }
    
    // Show the dashboard grids
    const dashboardGrids = document.querySelectorAll('.dashboard-grid');
    dashboardGrids.forEach(grid => {
      grid.style.display = 'grid';
    });
  }
  
  // Add click event handlers to all management buttons
  if (manageStaffBtn) {
    console.log("Found Manage Staff button");
    manageStaffBtn.addEventListener('click', showStaffManagement);
  }
  
  if (manageMenuBtn) {
    console.log("Found Manage Menu button");
    manageMenuBtn.addEventListener('click', showMenuManagement);
  }
  
  if (manageUsersBtn) {
    console.log("Found Manage Users button");
    manageUsersBtn.addEventListener('click', showUserManagement);
  }
  
  if (settingsBtn) {
    console.log("Found Settings button");
    settingsBtn.addEventListener('click', showSettings);
  }
  
  // Add click handlers for any existing back buttons
  document.querySelectorAll('button[id^="back-to-management"]').forEach(button => {
    button.addEventListener('click', backToManagement);
  });
}

// Add to admin.js
window.updateAdminOrders = function(newOrders) {
  console.log("Admin received orders update:", newOrders.length);
  // Store the orders for use in the admin view
  window.adminOrders = newOrders;
  
  // Update any open popup
  const popup = document.getElementById('table-popup');
  if (popup) {
    const tableNumber = popup.getAttribute('data-table');
    if (tableNumber) {
      // Close and reopen popup with new data
      closePopup();
      
      // Find orders for this table
      const tableOrders = newOrders.filter(order => 
        order.table_number.toString() === tableNumber.toString()
      );
      
      setTimeout(() => showTableOrderPopup(tableNumber, tableOrders), 100);
    }
  }
}

async function showTableOrderPopup(tableNumber) {
  console.log(`Showing popup for Table ${tableNumber}`);
  
  // Close any existing popups first
  const existingPopup = document.getElementById('table-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  try {
    // Fetch orders for this specific table from the backend
    const response = await fetch(`/api/orders/table/${tableNumber}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    const tableOrders = await response.json();
    
    console.log("All table orders:", tableOrders);
    
    // Find ACTIVE orders for this table (not delivered or cancelled)
    const activeOrders = tableOrders.filter(order => 
      order.status !== 'delivered' && order.status !== 'cancelled'
    );
    
    console.log(`Found ${activeOrders.length} ACTIVE orders for table ${tableNumber}`, activeOrders);
    
    // Use the most recent active order if available
    const orderData = activeOrders.length > 0 ? 
      activeOrders[activeOrders.length - 1] : null;
    
    if (orderData) {
      console.log("Using order data:", orderData);
      
      // Format the time
      const orderTime = new Date(orderData.created_at);
      const formattedTime = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Get status text with nice formatting
      let statusText = '';
      if (orderData.status === 'pending') {
        statusText = '<span style="color: #f59e0b; font-weight: 500;">Pending</span>';
      } else if (orderData.status === 'preparing') {
        statusText = '<span style="color: #2563eb; font-weight: 500;">Preparing</span>';
      } else if (orderData.status === 'ready') {
        statusText = '<span style="color: #16a34a; font-weight: 500;">Ready</span>';
      }
      
      // Create popup HTML without action buttons
      const popupHTML = `
      <div id="table-popup" data-table="${tableNumber}" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); width: 90%; max-width: 400px; z-index: 1000;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee;">
          <h3 style="margin: 0; font-size: 1.2rem;">Order #${orderData._id}</h3>
          <button id="close-popup" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>
        
        <div style="padding: 0.75rem 1rem; display: flex; justify-content: space-between; color: #666;">
          <span>Table ${tableNumber}</span>
          <span>${formattedTime}</span>
        </div>
        
        <div style="padding: 0.75rem 1rem; display: flex; justify-content: space-between; border-bottom: 1px solid #eee;">
          <span>Status:</span>
          <span>${statusText}</span>
        </div>
        
        <div style="padding: 0.75rem 1rem;">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem;">Order Items:</h4>
        </div>
        
        <div style="padding: 0 1rem 1rem;">
          ${orderData.items.map(item => {
            const specialInstructions = item.special_instructions 
              ? `<span style="background-color: #fff7ed; color: #f59e0b; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; display: inline-block; margin-left: 0.5rem;">${item.special_instructions}</span>` 
              : '';
            return `<div style="padding: 0.5rem 0; border-bottom: 1px dashed #eee;"><strong>${item.quantity}x</strong> ${item.menu_item_name} ${specialInstructions}</div>`;
          }).join('')}
        </div>
      </div>
      `;
      
      // Add popup to document
      document.body.insertAdjacentHTML('beforeend', popupHTML);
      
      // Add event listener for close button
      document.getElementById('close-popup').addEventListener('click', function() {
        closePopup();
      });
    } else {
      console.log("No active orders for table, showing empty state");
      // No order for this table, show a simple message
      const popupHTML = `
        <div id="table-popup" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); width: 90%; max-width: 400px; z-index: 1000;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee;">
            <h3 style="margin: 0; font-size: 1.2rem;">Table ${tableNumber}</h3>
            <button id="close-popup" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
          </div>
          
          <div style="padding: 1.5rem; text-align: center;">
            <p style="margin-bottom: 1rem;">No active orders for this table.</p>
          </div>
        </div>
      `;
      
      // Add popup to document
      document.body.insertAdjacentHTML('beforeend', popupHTML);
      
      // Add event listener for close button
      document.getElementById('close-popup').addEventListener('click', function() {
        closePopup();
      });
    }
  } catch (error) {
    console.error('Error fetching table orders:', error);
    // Show error popup
    const popupHTML = `
      <div id="table-popup" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); width: 90%; max-width: 400px; z-index: 1000;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee;">
          <h3 style="margin: 0; font-size: 1.2rem; color: red;">Error</h3>
          <button id="close-popup" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>
        
        <div style="padding: 1.5rem; text-align: center;">
          <p style="margin-bottom: 1rem;">Unable to fetch orders. Please try again.</p>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    document.getElementById('close-popup').addEventListener('click', function() {
      closePopup();
    });
  }
}

function setupTableButtons() {
  console.log("Setting up admin table buttons");
  
  const tableButtons = document.querySelectorAll('.tables-grid button');
  if (!tableButtons) {
    console.error("Table buttons not found");
    return;
  }
  
  tableButtons.forEach(button => {
    button.addEventListener('click', async function() {
      // Get table number from text content (the button's inner text)
      const tableNumber = this.textContent.trim();
      console.log(`Admin: Table ${tableNumber} clicked`);
      
      try {
        // First, try to get orders from localStorage
        const ordersStr = localStorage.getItem('allOrders');
        if (ordersStr) {
          const allOrders = JSON.parse(ordersStr);
          console.log(`Found ${allOrders.length} orders in localStorage`);
          
          // Filter for this table from localStorage
          const localTableOrders = allOrders.filter(order => 
            order.table_number.toString() === tableNumber.toString()
          );
          
          console.log(`Found ${localTableOrders.length} orders for table ${tableNumber} in localStorage`);
          
          // If local orders exist, show them immediately
          if (localTableOrders.length > 0) {
            showTableOrderPopup(tableNumber, localTableOrders);
          }
        }
        
        // Always fetch fresh data from the server
        const response = await fetch(`/api/orders/table/${tableNumber}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const serverTableOrders = await response.json();
        console.log("Server orders:", serverTableOrders);
        
        // Update localStorage with fresh data
        if (serverTableOrders.length > 0) {
          // Update or add to existing localStorage orders
          let allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
          
          // Remove existing orders for this table
          allOrders = allOrders.filter(order => 
            order.table_number.toString() !== tableNumber.toString()
          );
          
          // Add new server orders
          allOrders.push(...serverTableOrders);
          
          // Save updated orders
          localStorage.setItem('allOrders', JSON.stringify(allOrders));
          
          // Show the popup with server data
          showTableOrderPopup(tableNumber, serverTableOrders);
        } else {
          // No orders found on server
          showTableOrderPopup(tableNumber, []);
        }
        
      } catch (error) {
        console.error("Error fetching table orders:", error);
        
        // Fallback to localStorage if server fetch fails
        try {
          const ordersStr = localStorage.getItem('allOrders');
          if (ordersStr) {
            const allOrders = JSON.parse(ordersStr);
            const localTableOrders = allOrders.filter(order => 
              order.table_number.toString() === tableNumber.toString()
            );
            
            showTableOrderPopup(tableNumber, localTableOrders);
          } else {
            showTableOrderPopup(tableNumber, []);
          }
        } catch (localError) {
          console.error("Error accessing localStorage:", localError);
          showTableOrderPopup(tableNumber, []);
        }
      }
    });
  });
}
// Function to set up auto-refresh for table status
function setupAutoRefresh() {
  console.log("Setting up auto-refresh for table status");
  
  // Check for updates every 5 seconds
  const refreshInterval = 5000; // 5 seconds
  
  // Store the currently open table popup number (if any)
  let currentOpenTableNumber = null;
  
  // Set interval for auto-refresh
  setInterval(function() {
    // Update table status indicators
    updateAdminTableStatus();
    
    // If a popup is open, refresh its content
    const popup = document.getElementById('table-popup');
    if (popup) {
      currentOpenTableNumber = popup.getAttribute('data-table');
      if (currentOpenTableNumber) {
        // Get updated order data
        try {
          const ordersStr = localStorage.getItem('allOrders');
          if (ordersStr) {
            const allOrders = JSON.parse(ordersStr);
            
            // Filter for this table
            const tableOrders = allOrders.filter(order => 
              order.table_number.toString() === currentOpenTableNumber.toString()
            );
            
            // Close and reopen popup with fresh data
            closePopup();
            setTimeout(() => showTableOrderPopup(currentOpenTableNumber, tableOrders), 100);
          }
        } catch (error) {
          console.error("Error refreshing popup:", error);
        }
      }
    }
  }, refreshInterval);
  
  // Also listen for storage events from other tabs/windows
  window.addEventListener('storage', function(event) {
    if (event.key === 'allOrders' || event.key === 'staffOrders' || 
        event.key === 'adminOrderUpdate' || event.key === 'adminKitchenUpdate') {
      console.log("Storage event detected, refreshing data");
      updateAdminTableStatus();
      
      // Refresh popup if open
      const popup = document.getElementById('table-popup');
      if (popup) {
        const tableNum = popup.getAttribute('data-table');
        try {
          const ordersStr = localStorage.getItem('allOrders');
          if (ordersStr) {
            const allOrders = JSON.parse(ordersStr);
            const tableOrders = allOrders.filter(order => 
              order.table_number.toString() === tableNum.toString()
            );
            
            closePopup();
            setTimeout(() => showTableOrderPopup(tableNum, tableOrders), 100);
          }
        } catch (error) {
          console.error("Error refreshing popup from storage event:", error);
        }
      }
    }
  });
}

// Improved closePopup function for better reliability
function closePopup() {
  console.log("Closing popup");
  const popup = document.getElementById('table-popup');
  if (popup) {
    // Remove all event listeners by cloning and replacing
    const newPopup = popup.cloneNode(true);
    popup.parentNode.replaceChild(newPopup, popup);
    
    // Now remove the element
    newPopup.remove();
  }
}

// Function to update order status across all views (staff, kitchen, admin)
function updateOrderStatusAcrossViews(orderId, newStatus) {
  console.log(`Updating order ${orderId} to ${newStatus} across all views`);
  
  // Step 1: Update in localStorage (for all views to access)
  try {
    // Get the current orders
    let allOrders = [];
    const ordersStr = localStorage.getItem('allOrders');
    
    if (ordersStr) {
      allOrders = JSON.parse(ordersStr);
      
      // Find and update the specific order
      const orderIndex = allOrders.findIndex(o => o.order_id.toString() === orderId.toString());
      
      if (orderIndex >= 0) {
        // Update the status
        allOrders[orderIndex].status = newStatus;
        
        // Add timestamp for delivered orders
        if (newStatus === 'delivered') {
          allOrders[orderIndex].delivered_at = new Date().toISOString();
        }
        
        // If status is ready, add ready_at timestamp
        if (newStatus === 'ready') {
          allOrders[orderIndex].ready_at = new Date().toISOString();
        }
        
        // Save back to localStorage
        localStorage.setItem('allOrders', JSON.stringify(allOrders));
        
        // Step 2: Notify staff view
        localStorage.setItem('adminOrderUpdate', JSON.stringify({
          orderId: orderId,
          status: newStatus,
          timestamp: new Date().toISOString()
        }));
        
        // Step 3: Notify kitchen view
        localStorage.setItem('adminKitchenUpdate', JSON.stringify({
          orderId: orderId,
          status: newStatus,
          timestamp: new Date().toISOString()
        }));
        
        // Step 4: Update table status in admin view
        updateAdminTableStatus();
        
        // Step 5: Alert success
        alert(`Order #${orderId} has been ${newStatus === 'preparing' ? 'sent to kitchen' : 
                                           newStatus === 'ready' ? 'marked as ready' : 
                                           'marked as delivered'}`);
        
        return true;
      } else {
        console.error(`Order #${orderId} not found in orders array`);
      }
    }
  } catch (error) {
    console.error("Error updating order status:", error);
  }
  
  alert("Could not update order. Please try again.");
  return false;
}

function updateAdminTableStatus() {
  console.log("Updating admin table status");
  
  // Reset all tables to default state
  document.querySelectorAll('.tables-grid button').forEach(btn => {
    // Remove all status classes
    btn.classList.remove('occupied', 'reserved');
    
    // Force a DOM reflow to ensure classes are properly removed
    void btn.offsetWidth;
  });
  
  // Try to get orders from localStorage
  try {
    const ordersStr = localStorage.getItem('allOrders');
    if (ordersStr) {
      const allOrders = JSON.parse(ordersStr);
      
      // Set occupied tables based on active orders
      allOrders.forEach(order => {
        if (order.status !== 'delivered' && order.status !== 'cancelled') {
          const tableBtn = document.getElementById(`table-${order.table_number}`);
          if (tableBtn) {
            console.log(`Marking table ${order.table_number} as occupied`);
            tableBtn.classList.add('occupied');
            
            // Force a DOM reflow to ensure class is applied
            void tableBtn.offsetWidth;
          }
        }
      });
      
      // Set reserved tables (table 5 is always reserved in this example)
      const tableBtn5 = document.getElementById('table-5');
      if (tableBtn5) {
        console.log("Marking table 5 as reserved");
        tableBtn5.classList.add('reserved');
        
        // Force a DOM reflow to ensure class is applied
        void tableBtn5.offsetWidth;
      }
    }
  } catch (error) {
    console.error("Error updating table status:", error);
  }
}
// Helper function to update order status in staff view
function updateOrderStatusInStaff(orderId, newStatus) {
  console.log(`Updating order ${orderId} to ${newStatus}`);
  
  // Try to update directly if in same window
  if (typeof orders !== 'undefined') {
    const orderIndex = orders.findIndex(o => o.order_id.toString() === orderId.toString());
    if (orderIndex >= 0) {
      orders[orderIndex].status = newStatus;
      if (newStatus === 'delivered') {
        orders[orderIndex].delivered_at = new Date().toISOString();
      }
      
      // Refresh staff view if needed
      if (typeof fetchOrdersForTable === 'function' && typeof selectedTable !== 'undefined') {
        fetchOrdersForTable(selectedTable);
      }
      
      alert(`Order #${orderId} updated to ${newStatus}`);
      return true;
    }
  }
  
  // Try using localStorage as backup
  try {
    const ordersStr = localStorage.getItem('staffOrders');
    if (ordersStr) {
      const allOrders = JSON.parse(ordersStr);
      const orderIndex = allOrders.findIndex(o => o.order_id.toString() === orderId.toString());
      
      if (orderIndex >= 0) {
        allOrders[orderIndex].status = newStatus;
        if (newStatus === 'delivered') {
          allOrders[orderIndex].delivered_at = new Date().toISOString();
        }
        
        localStorage.setItem('staffOrders', JSON.stringify(allOrders));
        localStorage.setItem('adminOrderUpdate', JSON.stringify({
          orderId: orderId,
          status: newStatus,
          timestamp: new Date().toISOString()
        }));
        
        alert(`Order #${orderId} updated to ${newStatus}`);
        return true;
      }
    }
  } catch (error) {
    console.error("Error updating order status:", error);
  }
  
  alert("Could not update order. Please try again.");
  return false;
}

// Add this if it doesn't exist
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(amount)
    .replace('₫', '')
    .trim() + '₫';
}
function loadActiveOrders() {
  console.log('Loading all orders including completed...');

  // Notice we're now fetching ALL statuses, including 'delivered'
  fetch('/api/orders?status=pending,preparing,ready,delivered')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(allOrders => {
      console.log(`Received ${allOrders.length} orders`);
      const activeOrdersTableBody = document.querySelector('#admin-staff-view .data-table tbody');
      
      if (!activeOrdersTableBody) {
        console.error('Table body not found');
        return;
      }
      
      // Clear existing rows
      activeOrdersTableBody.innerHTML = '';
      
      // Check if we have any orders
      if (allOrders.length === 0) {
        activeOrdersTableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center;">
              No orders to display
            </td>
          </tr>
        `;
        return;
      }
      
      // Sort orders: active first, then completed (newest to oldest)
      allOrders.sort((a, b) => {
        // First sort by status (active before completed)
        if (a.status === 'delivered' && b.status !== 'delivered') return 1;
        if (a.status !== 'delivered' && b.status === 'delivered') return -1;
        
        // Then sort by time (newest first)
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      // Populate table with all orders
      allOrders.forEach(order => {
        const row = document.createElement('tr');
        
        // Determine status badge class
        let badgeClass = 'yellow';
        if (order.status === 'preparing') {
          badgeClass = 'blue';
        } else if (order.status === 'ready') {
          badgeClass = 'green';
        } else if (order.status === 'delivered') {
          badgeClass = 'gray';
        }
        
        const statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);
        
        // Format the time
        const orderTime = new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        row.innerHTML = `
          <td style="text-align: center;">${order._id}</td>
          <td style="text-align: center;">Table ${order.table_number}</td>
          <td style="text-align: center;">${order.items.length} items</td>
          <td style="text-align: center;"><span class="badge ${badgeClass}">${statusText}</span></td>
          <td style="text-align: center;">${formatCurrency(order.total_amount)}</td>
          <td style="text-align: center;">
            <button class="small secondary" onclick="showOrderDetails('${order._id}')">View</button>
            ${order.status === 'delivered' ? 
              `<span class="delivered-time">at ${new Date(order.delivered_at || order.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>` : 
              ''}
          </td>
        `;
        
        activeOrdersTableBody.appendChild(row);
      });
      
      // Update active orders count (excluding delivered)
      const activeCount = allOrders.filter(order => order.status !== 'delivered').length;
      const activeOrdersCountElement = document.getElementById('active-orders-count');
      if (activeOrdersCountElement) {
        activeOrdersCountElement.textContent = activeCount;
      }
    })
    .catch(error => {
      console.error('Error loading orders:', error);
      
      const activeOrdersTableBody = document.querySelector('#admin-staff-view .data-table tbody');
      if (activeOrdersTableBody) {
        activeOrdersTableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: red;">
              Unable to load orders. Please try again later.
            </td>
          </tr>
        `;
      }
    });
}


// Helper function to show order details modal
function showOrderDetails(orderId) {
  console.log(`Showing details for order: ${orderId}`);
  
  // Prevent issues with 'events' as an order ID
  if (orderId === 'events') {
    console.error('Invalid order ID: events');
    return;
  }

  fetch(`/api/orders/${orderId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch order details: ${response.status}`);
      }
      return response.json();
    })
    .then(orderDetails => {
      console.log('Received order details:', orderDetails);
      
      // Create modal for order details
      const modalBackdrop = document.getElementById('modal-backdrop');
      if (!modalBackdrop) {
        console.error('Modal backdrop element not found');
        return;
      }
      
      const orderModal = document.createElement('div');
      orderModal.className = 'modal';
      orderModal.innerHTML = `
        <div class="modal-header">
          <h3>Order Details #${orderDetails._id}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="order-detail-row"><strong>Table:</strong> ${orderDetails.table_number}</div>
          <div class="order-detail-row"><strong>Status:</strong> ${orderDetails.status}</div>
          <div class="order-detail-row"><strong>Time:</strong> ${new Date(orderDetails.created_at).toLocaleTimeString()}</div>
          <h4>Items:</h4>
          <ul class="order-items-list">
            ${orderDetails.items.map(item => `
              <li>
                <strong>${item.quantity}x</strong> ${item.menu_item_name} 
                ${item.special_instructions ? `<span class="special-instruction">(${item.special_instructions})</span>` : ''}
              </li>
            `).join('')}
          </ul>
          <div class="order-detail-total"><strong>Total:</strong> ${formatCurrency(orderDetails.total_amount)}</div>
        </div>
      `;
      
      modalBackdrop.innerHTML = ''; // Clear previous content
      modalBackdrop.appendChild(orderModal);
      modalBackdrop.style.display = 'block';
      orderModal.style.display = 'block';
      
      // Close button functionality
      orderModal.querySelector('.modal-close').addEventListener('click', () => {
        modalBackdrop.style.display = 'none';
        modalBackdrop.innerHTML = '';
      });
    })
    .catch(error => {
      console.error('Error fetching order details:', error);
      alert(`Could not fetch order details: ${error.message}`);
    });
}

// Helper function to deliver an order
function deliverOrder(orderId) {
  console.log(`Marking order ${orderId} as delivered`);
  
  fetch(`/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'delivered' })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to update order status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Order successfully delivered:', data);
    // Refresh orders immediately after delivery
    loadActiveOrders();
  })
  .catch(error => {
    console.error('Error delivering order:', error);
    alert(`Could not deliver order: ${error.message}`);
  });
}

// Setup periodic refresh
function setupOrderRefresh() {
  console.log('Setting up order refresh');
  
  // Initial load
  loadActiveOrders();
  
  // Refresh every 10 seconds (slightly longer to reduce server load)
  const refreshInterval = setInterval(loadActiveOrders, 10000);
  
  // Clear interval when navigating away from staff view
  const staffBtn = document.getElementById('admin-staff-btn');
  const otherBtns = document.querySelectorAll('#admin-kitchen-btn, #admin-analytics-btn, #admin-management-btn');
  
  if (staffBtn) {
    staffBtn.addEventListener('click', function() {
      // When returning to staff view, load immediately
      loadActiveOrders();
    });
  }
  
  otherBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', function() {
        // Pause refreshing when not on staff view
        clearInterval(refreshInterval);
      });
    }
  });
  
  // Setup Socket.IO event listeners if io is available
  if (typeof io !== 'undefined') {
    const socket = io();
    
    socket.on('connect', () => {
      console.log('Socket connected, joining admin and staff rooms');
      socket.emit('join', { role: 'admin' });
      socket.emit('joinStaff');
    });
    
    socket.on('orderStatusChanged', data => {
      console.log('Order status changed via socket:', data);
      loadActiveOrders();
    });
    
    socket.on('newOrder', data => {
      console.log('New order received via socket:', data);
      loadActiveOrders();
    });
  } else {
    console.warn('Socket.IO not available, real-time updates disabled');
  }
}
// Admin Kitchen View Functions with improved error handling
// These functions handle loading and displaying kitchen orders in the admin dashboard

/**
 * Load kitchen orders and update the admin kitchen view
 */
function loadKitchenOrders() {
  console.log('Loading kitchen orders for admin view...');
  
  // Show loading state
  const pendingContainer = document.querySelector('#admin-kitchen-view .kitchen-orders .card:first-child .card-content');
  const preparingContainer = document.querySelector('#admin-kitchen-view .kitchen-orders .card:last-child .card-content');
  
  if (pendingContainer) {
    pendingContainer.innerHTML = '<div class="loading-spinner">Loading orders...</div>';
  }
  if (preparingContainer) {
    preparingContainer.innerHTML = '<div class="loading-spinner">Loading orders...</div>';
  }
  
  // Fetch orders from the API with proper error handling
  fetch('/api/orders?status=pending,preparing,ready')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(orders => {
      if (!Array.isArray(orders)) {
        console.warn('Unexpected response format, expected array:', orders);
        orders = []; // Fallback to empty array
      }
      
      console.log(`Received ${orders.length} orders for kitchen view`);
      
      // Process orders by status
      const pendingOrders = orders.filter(order => order.status === 'pending');
      const preparingOrders = orders.filter(order => order.status === 'preparing');
      const completedOrders = orders.filter(order => order.status === 'ready');
      
      // Update kitchen view sections
      updateKitchenOrdersSection(pendingOrders, preparingOrders);
      
      // Update the stats in the dashboard cards
      updateKitchenStats(pendingOrders.length, preparingOrders.length, completedOrders.length);
    })
    .catch(error => {
      console.error('Error loading kitchen orders:', error);
      
      // Show error message in containers
      if (pendingContainer) {
        pendingContainer.innerHTML = `<div class="error-message">Failed to load orders: ${error.message}</div>`;
      }
      if (preparingContainer) {
        preparingContainer.innerHTML = `<div class="error-message">Failed to load orders: ${error.message}</div>`;
      }
      
      // Attempt to retry after a delay
      setTimeout(loadKitchenOrders, 30000); // Retry after 30 seconds
    });
}

/**
 * Update the kitchen orders sections in the admin view
 * @param {Array} pendingOrders - Array of pending orders
 * @param {Array} preparingOrders - Array of orders in preparation
 */
function updateKitchenOrdersSection(pendingOrders, preparingOrders) {
  try {
    console.log('Updating kitchen orders section...');
    
    // Get containers
    const pendingContainer = document.querySelector('#admin-kitchen-view .kitchen-orders .card:first-child .card-content');
    const preparingContainer = document.querySelector('#admin-kitchen-view .kitchen-orders .card:last-child .card-content');
    
    if (!pendingContainer || !preparingContainer) {
      console.error('Kitchen order containers not found in admin view');
      return;
    }
    
    // Clear current content
    pendingContainer.innerHTML = '';
    preparingContainer.innerHTML = '';
    
    // Check if there are pending orders
    if (pendingOrders.length === 0) {
      pendingContainer.innerHTML = '<div class="empty-state">No pending orders</div>';
    } else {
      // Add each pending order
      pendingOrders.forEach(order => {
        pendingContainer.appendChild(createKitchenOrderCard(order, 'pending'));
      });
    }
    
    // Check if there are orders in preparation
    if (preparingOrders.length === 0) {
      preparingContainer.innerHTML = '<div class="empty-state">No orders in preparation</div>';
    } else {
      // Add each preparing order
      preparingOrders.forEach(order => {
        preparingContainer.appendChild(createKitchenOrderCard(order, 'preparing'));
      });
    }
  } catch (error) {
    console.error('Error updating kitchen orders section:', error);
  }
}

/**
 * Create a kitchen order card for the admin view
 * @param {Object} order - The order object
 * @param {String} status - The order status ('pending' or 'preparing')
 * @returns {HTMLElement} The kitchen order card element
 */
function createKitchenOrderCard(order, status) {
  try {
    // Safely get order ID, handling both formats
    const orderId = order._id || order.order_id || 'unknown';
    const isPending = status === 'pending';
    
    // Safely get table number with fallback
    const tableNumber = order.table_number || 'N/A';
    
    // Format the created time
    let formattedTime = 'N/A';
    try {
      if (order.created_at) {
        const orderTime = new Date(order.created_at);
        formattedTime = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {
      console.warn('Error formatting time:', e);
    }
    
    // Calculate estimated preparation time (only for preparing orders)
    let estPrepTime = '';
    if (!isPending) {
      const estimatedMinutes = 15; // Default 15 minutes
      estPrepTime = `<div class="kitchen-order-prep-time">
        <span class="font-medium">Est. prep time:</span> ${estimatedMinutes} minutes
      </div>`;
    }
    
    // Safely handle items
    let itemsHtml = '<div>No items found</div>';
    if (Array.isArray(order.items) && order.items.length > 0) {
      itemsHtml = order.items.map(item => {
        const quantity = item.quantity || 1;
        const name = item.menu_item_name || 'Unknown item';
        const instructions = item.special_instructions ? 
          `<span class="note">${item.special_instructions}</span>` : '';
        
        return `<div><strong>${quantity}x</strong> ${name} ${instructions}</div>`;
      }).join('');
    }
    
    // Create card element
    const card = document.createElement('div');
    card.className = 'kitchen-order-card';
    card.setAttribute('data-order-id', orderId);
    
    // Build card HTML
    card.innerHTML = `
      <div class="kitchen-order-header">
        <div class="kitchen-order-title">
          <span>Order #${orderId}</span>
          <span class="badge ${isPending ? 'yellow' : 'blue'}">${isPending ? 'New Order' : 'In Preparation'}</span>
        </div>
        <div class="kitchen-order-subtitle">
          <span>Table ${tableNumber}</span>
          <span>${formattedTime}</span>
        </div>
      </div>
      <div class="kitchen-order-content">
        <div class="kitchen-order-items">
          ${itemsHtml}
        </div>
        ${estPrepTime}
      </div>
      <div class="kitchen-order-footer">
        <button class="primary" data-order-id="${orderId}" data-action="${isPending ? 'start' : 'complete'}">
          ${isPending ? 'Start Preparing' : 'Mark as Ready'}
        </button>
      </div>
    `;
    
    // Add event listener to button
    const actionButton = card.querySelector('.kitchen-order-footer button');
    if (actionButton) {
      actionButton.addEventListener('click', handleKitchenOrderAction);
    }
    
    return card;
  } catch (error) {
    console.error('Error creating kitchen order card:', error);
    
    // Return a fallback error card
    const errorCard = document.createElement('div');
    errorCard.className = 'kitchen-order-card error';
    errorCard.innerHTML = `
      <div class="kitchen-order-header">
        <div class="kitchen-order-title">
          <span>Error Loading Order</span>
        </div>
      </div>
      <div class="kitchen-order-content">
        <div class="error-message">Failed to display order details</div>
      </div>
    `;
    return errorCard;
  }
}

/**
 * Handle kitchen order action button clicks (Start Preparing or Mark as Ready)
 * @param {Event} event - The click event
 */
function handleKitchenOrderAction(event) {
  try {
    const button = event.currentTarget;
    const orderId = button.getAttribute('data-order-id');
    const action = button.getAttribute('data-action');
    
    if (!orderId) {
      console.error('Order ID not found on button');
      return;
    }
    
    // Disable button to prevent double clicks
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Processing...';
    
    let newStatus = '';
    if (action === 'start') {
      newStatus = 'preparing';
    } else if (action === 'complete') {
      newStatus = 'ready';
    } else {
      console.error('Unknown action:', action);
      button.disabled = false;
      button.textContent = originalText;
      return;
    }
    
    // Update order status via API
    updateOrderStatusFromAdmin(orderId, newStatus)
      .then(updatedOrder => {
        console.log(`Order ${orderId} updated to ${newStatus}`);
        // Reload kitchen orders to refresh the view
        loadKitchenOrders();
      })
      .catch(error => {
        console.error(`Error updating order ${orderId}:`, error);
        // Re-enable button on error
        button.disabled = false;
        button.textContent = originalText;
        
        // Show error message
        showErrorNotification(`Failed to update order: ${error.message}`);
      });
  } catch (error) {
    console.error('Error handling kitchen order action:', error);
  }
}

/**
 * Update order status from admin view
 * @param {String} orderId - The order ID
 * @param {String} newStatus - The new status
 * @returns {Promise<Object>} The updated order
 */
async function updateOrderStatusFromAdmin(orderId, newStatus) {
  console.log(`Admin updating order ${orderId} to ${newStatus}`);
  
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    const adminName = currentUser.name || 'Admin';
    
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        status: newStatus,
        updated_by: adminName
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to update status: ${errorData}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in updateOrderStatusFromAdmin:', error);
    throw error;
  }
}

/**
 * Update kitchen stats in the admin dashboard
 * @param {Number} pendingCount - Number of pending orders
 * @param {Number} preparingCount - Number of orders in preparation
 * @param {Number} completedToday - Number of completed orders today
 */
function updateKitchenStats(pendingCount, preparingCount, completedToday) {
  try {
    // Orders overview card
    const pendingCountEl = document.querySelector('#admin-kitchen-view .card:nth-child(1) .stat-grid .stat-item:first-child .stat-number');
    const preparingCountEl = document.querySelector('#admin-kitchen-view .card:nth-child(1) .stat-grid .stat-item:last-child .stat-number');
    
    // Performance card
    const completedTodayEl = document.querySelector('#admin-kitchen-view .card:nth-child(2) .stat-grid .stat-item:last-child .stat-number');
    
    // Update elements if they exist
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (preparingCountEl) preparingCountEl.textContent = preparingCount;
    if (completedTodayEl) completedTodayEl.textContent = completedToday;
  } catch (error) {
    console.error('Error updating kitchen stats:', error);
  }
}

/**
 * Set up real-time updates for the kitchen view
 */
function setupKitchenViewRefresh() {
  try {
    // Initial load
    loadKitchenOrders();
    
    // Set up auto-refresh with error handling
    let refreshInterval;
    
    function startRefreshInterval() {
      if (refreshInterval) clearInterval(refreshInterval);
      
      refreshInterval = setInterval(() => {
        try {
          // Only refresh if kitchen view is visible
          if (!document.getElementById('admin-kitchen-view').classList.contains('hidden')) {
            loadKitchenOrders();
          }
        } catch (error) {
          console.error('Error during auto-refresh:', error);
        }
      }, 30000); // Refresh every 30 seconds
    }
    
    startRefreshInterval();
    
    // Handle tab switching to ensure proper refresh behavior
    const kitchenBtn = document.getElementById('admin-kitchen-btn');
    if (kitchenBtn) {
      kitchenBtn.addEventListener('click', () => {
        // Immediate refresh when switching to kitchen view
        loadKitchenOrders();
        startRefreshInterval();
      });
    }
    
    // Clear interval when switching away from kitchen view
    const otherTabs = document.querySelectorAll('#admin-staff-btn, #admin-analytics-btn, #admin-management-btn');
    otherTabs.forEach(tab => {
      if (tab) {
        tab.addEventListener('click', () => {
          if (refreshInterval) clearInterval(refreshInterval);
        });
      }
    });
    
    // Set up socket.io event listeners for real-time updates
    setupSocketListeners();
  } catch (error) {
    console.error('Error setting up kitchen view refresh:', error);
  }
}

/**
 * Set up socket.io listeners for real-time updates
 */
function setupSocketListeners() {
  try {
    if (typeof io !== 'undefined') {
      const socket = io();
      
      socket.on('connect', () => {
        console.log('Socket connected for admin kitchen view');
        socket.emit('join', { role: 'admin' });
        socket.emit('joinKitchen');
      });
      
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
      
      // Listen for order status changes
      socket.on('orderStatusChanged', data => {
        console.log('Order status changed via socket:', data);
        if (!document.getElementById('admin-kitchen-view').classList.contains('hidden')) {
          loadKitchenOrders();
        }
      });
      
      // Listen for new orders
      socket.on('newOrder', data => {
        console.log('New order received via socket:', data);
        if (!document.getElementById('admin-kitchen-view').classList.contains('hidden')) {
          loadKitchenOrders();
          playNotificationSound();
        }
      });
    } else {
      console.warn('Socket.io not available, falling back to polling');
    }
  } catch (error) {
    console.error('Error setting up socket listeners:', error);
  }
}

/**
 * Play a notification sound for new orders
 */
function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5; // Set volume to 50%
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn('Error playing notification sound:', error);
        // Most browsers require user interaction before playing audio
      });
    }
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}

/**
 * Show error notification to the user
 * @param {String} message - Error message to display
 */
function showErrorNotification(message) {
  console.error('Error notification:', message);
  
  try {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#f44336';
    notification.style.color = 'white';
    notification.style.padding = '15px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '250px';
    notification.style.maxWidth = '350px';
    
    notification.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="flex-grow: 1;">${message}</span>
        <span style="cursor: pointer; margin-left: 10px; font-weight: bold;" onclick="this.parentNode.parentNode.remove()">×</span>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  } catch (error) {
    console.error('Error showing notification:', error);
    // Fallback to alert
    alert(message);
  }
}

// Initialize kitchen view when admin.js loads
document.addEventListener('DOMContentLoaded', function() {
  try {
    // Set up kitchen view if admin is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.role === 'admin') {
      // Wait a short time to ensure DOM is fully loaded
      setTimeout(setupKitchenViewRefresh, 500);
    }
  } catch (error) {
    console.error('Error initializing admin kitchen view:', error);
  }
});
// Admin Analytics Functions
// These functions handle loading and displaying analytics data in the admin dashboard

/**
 * Initialize analytics dashboard
 * Called when the analytics tab is clicked or the page loads
 */
// Replace this function
function initializeAnalyticsDashboard() {
  console.log('Initializing analytics dashboard...');
  
  // Show loading state for all cards
  showLoadingState();
  
  // Load all analytics data in parallel
  Promise.all([
    fetchRevenueData(),
    fetchCustomerSatisfactionData(),
    fetchOperationsData()
  ])
  .then(([revenueData, satisfactionData, operationsData]) => {
    // Update all dashboard sections with the retrieved data
    updateRevenueDashboard(revenueData);
    updateCustomerSatisfactionDashboard(satisfactionData);
    updateOperationsDashboard(operationsData);
    
    console.log('Analytics dashboard initialized successfully');
  })
  .catch(error => {
    console.error('Error initializing analytics dashboard:', error);
    showErrorState('Failed to load analytics data. Please try again.');
  });
}
/**
 * Show loading state for analytics cards
 */
function showLoadingState() {
  // Get all stat number elements in the analytics view
  const statElements = document.querySelectorAll('#admin-analytics-view .stat-number');
  
  // Replace current values with loading indicators
  statElements.forEach(element => {
    // Save current value as a data attribute
    const currentValue = element.textContent;
    element.setAttribute('data-original-value', currentValue);
    
    // Show loading state
    element.textContent = '...';
    element.classList.add('loading');
  });
}

/**
 * Show error state when data fetching fails
 * @param {string} message - Error message to display
 */
function showErrorState(message) {
  // Create error notification
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.style.backgroundColor = '#f44336';
  notification.style.color = 'white';
  notification.style.padding = '10px 15px';
  notification.style.margin = '10px 0';
  notification.style.borderRadius = '4px';
  notification.style.textAlign = 'center';
  notification.textContent = message;
  
  // Add to the top of the analytics view
  const analyticsView = document.getElementById('admin-analytics-view');
  if (analyticsView) {
    analyticsView.insertBefore(notification, analyticsView.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
  
  // Restore original values if they were saved
  const statElements = document.querySelectorAll('#admin-analytics-view .stat-number.loading');
  statElements.forEach(element => {
    const originalValue = element.getAttribute('data-original-value');
    if (originalValue) {
      element.textContent = originalValue;
    } else {
      element.textContent = 'N/A';
    }
    element.classList.remove('loading');
  });
}

/**
 * Format currency values in millions (M₫)
 * @param {number} amount - Amount in VND
 * @returns {string} Formatted amount in M₫
 */
function formatCurrencyInMillions(amount) {
  const inMillions = (amount / 1000000).toFixed(1);
  return `${inMillions}M₫`;
}
function initializeAnalyticsDashboard(showLoading = true) {
  console.log('Initializing analytics dashboard with enhanced revenue tracking...');
  
  // Show loading state if requested
  if (showLoading) {
    showLoadingState();
  }
  
  // Load all analytics data in parallel with better error handling
  Promise.all([
    fetchRevenueData().catch(error => {
      console.error('Revenue data fetch failed:', error);
      return getRevenueDataFallback();
    }),
    fetchCustomerSatisfactionData().catch(error => {
      console.error('Customer satisfaction data fetch failed:', error);
      return { averageRating: 4.5, satisfactionPercentage: 90 };
    }),
    fetchOperationsData().catch(error => {
      console.error('Operations data fetch failed:', error);
      return { averageOrderValue: 240000, averagePreparationTime: 18 };
    })
  ])
  .then(([revenueData, satisfactionData, operationsData]) => {
    // Update all dashboard sections with the retrieved data
    updateRevenueDashboard(revenueData);
    updateCustomerSatisfactionDashboard(satisfactionData);
    updateOperationsDashboard(operationsData);
    
    // Call fixRevenueChart after a short delay
    setTimeout(fixRevenueChart, 100);
    
    console.log('Analytics dashboard initialized successfully with enhanced revenue tracking');
  })
  .catch(error => {
    console.error('Error initializing analytics dashboard:', error);
    showErrorState('Failed to load analytics data. Please try again.');
    
    // Still try to show chart even if other data fails
    setTimeout(fixRevenueChart, 100);
  });
}

// Replace the fetchRevenueData function
async function fetchRevenueData() {
  console.log('Fetching revenue data with enhanced time periods...');
  
  try {
    // Set up request timeout
    const TIMEOUT_MS = 8000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    // Fetch daily revenue data with timeout control
    const dailyResponse = await fetch('/api/orders/revenue', {
      signal: controller.signal
    });
    
    // Clear timeout after successful response
    clearTimeout(timeoutId);
    
    // Check response validity
    if (!dailyResponse.ok) {
      throw new Error(`HTTP error! status: ${dailyResponse.status}`);
    }
    
    // Parse the response
    const revenueData = await dailyResponse.json();
    console.log('Received revenue data:', revenueData);
    
    // Calculate growth rates and additional insights
    const todayRevenue = revenueData.today || 0;
    const yesterdayRevenue = revenueData.yesterday || todayRevenue * 0.95; // Estimate if not provided
    const thisWeekRevenue = revenueData.week || 0;
    const lastWeekRevenue = revenueData.lastWeek || thisWeekRevenue * 0.95; // Estimate if not provided
    
    // Calculate growth rates
    const dailyGrowth = calculateGrowthRate(todayRevenue, yesterdayRevenue);
    const weeklyGrowth = calculateGrowthRate(thisWeekRevenue, lastWeekRevenue);
    
    // Return enhanced revenue data
    return {
      daily: {
        today: todayRevenue,
        yesterday: yesterdayRevenue,
        growth: dailyGrowth
      },
      weekly: {
        thisWeek: thisWeekRevenue,
        lastWeek: lastWeekRevenue,
        growth: weeklyGrowth
      }
    };
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    
    // If the error is a timeout, provide a specific message
    if (error.name === 'AbortError') {
      console.warn('Revenue data fetch timed out, using fallback data');
    }
    
    // Re-throw to allow caller to handle it
    throw error;
  }
}

/**
 * Fetch customer satisfaction data from API
 * @returns {Promise<Object>} Customer satisfaction data
 */
async function fetchCustomerSatisfactionData() {
  console.log('Fetching customer satisfaction data...');
  
  try {
    // Check if we're in development mode or APIs are not available
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          !window.location.hostname;
    
    // If in development or API endpoints aren't set up yet, use fallback data
    if (isDevelopment) {
      console.log('Using fallback customer satisfaction data for development');
      return {
        averageRating: 4.7,
        satisfactionPercentage: 94
      };
    }
    
    const response = await fetch('/api/analytics/customer-satisfaction');
    
    // Check for non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Customer satisfaction API did not return JSON, using fallback data');
      throw new Error('API did not return JSON');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      averageRating: data.averageRating || 0,
      satisfactionPercentage: data.satisfactionPercentage || 0
    };
  } catch (error) {
    console.error('Error fetching customer satisfaction data:', error);
    
    // Return fallback data
    return {
      averageRating: 4.7,
      satisfactionPercentage: 94
    };
  }
}

/**
 * Fetch operations data from API
 * @returns {Promise<Object>} Operations metrics data
 */
async function fetchOperationsData() {
  console.log('Fetching operations data...');
  
  try {
    // Check if we're in development mode or APIs are not available
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          !window.location.hostname;
    
    // If in development or API endpoints aren't set up yet, use fallback data
    if (isDevelopment) {
      console.log('Using fallback operations data for development');
      return {
        averageOrderValue: 250000,
        averagePreparationTime: 18
      };
    }
    
    const response = await fetch('/api/analytics/operations');
    
    // Check for non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Operations API did not return JSON, using fallback data');
      throw new Error('API did not return JSON');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      averageOrderValue: data.averageOrderValue || 0,
      averagePreparationTime: data.averagePreparationTime || 0
    };
  } catch (error) {
    console.error('Error fetching operations data:', error);
    
    // Return fallback data
    return {
      averageOrderValue: 250000,
      averagePreparationTime: 18
    };
  }
}



// Replace the updateRevenueDashboard function
function updateRevenueDashboard(data) {
  console.log('Updating revenue dashboard with enhanced visualization:', data);
  
  try {
    // Daily revenue card
    const todayRevenueEl = document.querySelector('#admin-analytics-view .card:nth-child(1) .stat-item:first-child .stat-number');
    const yesterdayRevenueEl = document.querySelector('#admin-analytics-view .card:nth-child(1) .stat-item:last-child .stat-number');
    
    // Weekly comparison card
    const thisWeekRevenueEl = document.querySelector('#admin-analytics-view .card:nth-child(2) .stat-item:first-child .stat-number');
    const lastWeekRevenueEl = document.querySelector('#admin-analytics-view .card:nth-child(2) .stat-item:last-child .stat-number');
    
    // Update daily revenue elements if they exist
    if (todayRevenueEl) {
      // Format the revenue value
      todayRevenueEl.textContent = formatCurrencyInMillions(data.daily.today);
      todayRevenueEl.classList.remove('loading');
      
      // Add growth indicator with visual cues
      if (data.daily.growth !== undefined) {
        addGrowthIndicator(todayRevenueEl, data.daily.growth);
      } else {
        // Add growth indicator based on comparison with yesterday
        const growth = calculateGrowthRate(data.daily.today, data.daily.yesterday);
        addGrowthIndicator(todayRevenueEl, growth);
      }
    }
    
    if (yesterdayRevenueEl) {
      yesterdayRevenueEl.textContent = formatCurrencyInMillions(data.daily.yesterday);
      yesterdayRevenueEl.classList.remove('loading');
    }
    
    // Update weekly revenue elements if they exist
    if (thisWeekRevenueEl) {
      thisWeekRevenueEl.textContent = formatCurrencyInMillions(data.weekly.thisWeek);
      thisWeekRevenueEl.classList.remove('loading');
      
      // Add growth indicator with visual cues
      if (data.weekly.growth !== undefined) {
        addGrowthIndicator(thisWeekRevenueEl, data.weekly.growth);
      } else {
        // Add growth indicator based on comparison with last week
        const growth = calculateGrowthRate(data.weekly.thisWeek, data.weekly.lastWeek);
        addGrowthIndicator(thisWeekRevenueEl, growth);
      }
    }
    
    if (lastWeekRevenueEl) {
      lastWeekRevenueEl.textContent = formatCurrencyInMillions(data.weekly.lastWeek);
      lastWeekRevenueEl.classList.remove('loading');
    }
  } catch (error) {
    console.error('Error updating revenue dashboard:', error);
    
    // Attempt to restore elements to a clean state
    const statElements = document.querySelectorAll('#admin-analytics-view .card:nth-child(1) .stat-number, #admin-analytics-view .card:nth-child(2) .stat-number');
    statElements.forEach(element => {
      element.classList.remove('loading', 'positive', 'negative');
    });
  }
}

/**
 * Update customer satisfaction dashboard with fetched data
 * @param {Object} data - Customer satisfaction data object
 */
function updateCustomerSatisfactionDashboard(data) {
  console.log('Updating customer satisfaction dashboard with:', data);
  
  try {
    // Customer satisfaction card
    const ratingEl = document.querySelector('#admin-analytics-view .card:nth-child(3) .stat-item:first-child .stat-number');
    const satisfactionPercentageEl = document.querySelector('#admin-analytics-view .card:nth-child(3) .stat-item:last-child .stat-number');
    
    // Update elements if they exist
    if (ratingEl) {
      ratingEl.textContent = data.averageRating.toFixed(1);
      ratingEl.classList.remove('loading');
      
      // Add color indication based on rating value
      if (data.averageRating >= 4.5) {
        ratingEl.classList.add('positive');
        ratingEl.classList.remove('warning', 'negative');
      } else if (data.averageRating >= 3.5) {
        ratingEl.classList.add('warning');
        ratingEl.classList.remove('positive', 'negative');
      } else {
        ratingEl.classList.add('negative');
        ratingEl.classList.remove('positive', 'warning');
      }
    }
    
    if (satisfactionPercentageEl) {
      satisfactionPercentageEl.textContent = `${data.satisfactionPercentage}%`;
      satisfactionPercentageEl.classList.remove('loading');
      
      // Add color indication based on percentage value
      if (data.satisfactionPercentage >= 90) {
        satisfactionPercentageEl.classList.add('positive');
        satisfactionPercentageEl.classList.remove('warning', 'negative');
      } else if (data.satisfactionPercentage >= 75) {
        satisfactionPercentageEl.classList.add('warning');
        satisfactionPercentageEl.classList.remove('positive', 'negative');
      } else {
        satisfactionPercentageEl.classList.add('negative');
        satisfactionPercentageEl.classList.remove('positive', 'warning');
      }
    }
  } catch (error) {
    console.error('Error updating customer satisfaction dashboard:', error);
  }
}

/**
 * Update operations dashboard with fetched data
 * @param {Object} data - Operations data object
 */
function updateOperationsDashboard(data) {
  console.log('Updating operations dashboard with:', data);
  
  try {
    // Operations card
    const avgOrderValueEl = document.querySelector('#admin-analytics-view .card:nth-child(4) .stat-item:first-child .stat-number');
    const avgPrepTimeEl = document.querySelector('#admin-analytics-view .card:nth-child(4) .stat-item:last-child .stat-number');
    
    // Update elements if they exist
    if (avgOrderValueEl) {
      // Convert to thousands for display (e.g., 250,000₫ becomes 250)
      const valueInThousands = Math.round(data.averageOrderValue / 1000);
      avgOrderValueEl.textContent = valueInThousands;
      avgOrderValueEl.classList.remove('loading');
    }
    
    if (avgPrepTimeEl) {
      avgPrepTimeEl.textContent = data.averagePreparationTime;
      avgPrepTimeEl.classList.remove('loading');
      
      // Add color indication based on preparation time
      // Lower preparation time is better
      if (data.averagePreparationTime <= 15) {
        avgPrepTimeEl.classList.add('positive');
        avgPrepTimeEl.classList.remove('warning', 'negative');
      } else if (data.averagePreparationTime <= 20) {
        avgPrepTimeEl.classList.add('warning');
        avgPrepTimeEl.classList.remove('positive', 'negative');
      } else {
        avgPrepTimeEl.classList.add('negative');
        avgPrepTimeEl.classList.remove('positive', 'warning');
      }
    }
  } catch (error) {
    console.error('Error updating operations dashboard:', error);
  }
}


function getRevenueDataFallback() {
  console.log('Using fallback revenue data');
  return {
    daily: {
      today: 5200000,
      yesterday: 4800000,
      growth: 8.33 // (5.2 - 4.8) / 4.8 * 100
    },
    weekly: {
      thisWeek: 34800000,
      lastWeek: 31500000,
      growth: 10.48 // (34.8 - 31.5) / 31.5 * 100
    }
  };
}

// Replace or add the formatCurrencyInMillions function
function formatCurrencyInMillions(amount, precision = 1) {
  // Handle edge cases
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.0M₫';
  }
  
  // Convert to millions and round to specified precision
  const inMillions = (amount / 1000000).toFixed(precision);
  
  // Add thousands separator if needed
  const formattedValue = inMillions.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${formattedValue}M₫`;
}

// Add these new helper functions
function calculateGrowthRate(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function addGrowthIndicator(element, growthRate) {
  // Reset classes first
  element.classList.remove('positive', 'negative', 'neutral');
  
  // Remove any existing growth indicators that are siblings of this element
  const existingIndicators = element.parentNode.querySelectorAll('.growth-indicator');
  existingIndicators.forEach(indicator => indicator.remove());
  
  // Add appropriate class based on growth rate
  if (growthRate > 0) {
    element.classList.add('positive');
    
    // Add growth indicator icon and percentage
    const growthSpan = document.createElement('span');
    growthSpan.className = 'growth-indicator positive';
    growthSpan.innerHTML = `<i class="fas fa-arrow-up"></i> ${growthRate.toFixed(1)}%`;
    
    // Add growth span after the element
    element.parentNode.insertBefore(growthSpan, element.nextSibling);
  } else if (growthRate < 0) {
    element.classList.add('negative');
    
    // Add decline indicator icon and percentage
    const growthSpan = document.createElement('span');
    growthSpan.className = 'growth-indicator negative';
    growthSpan.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(growthRate).toFixed(1)}%`;
    
    // Add growth span after the element
    element.parentNode.insertBefore(growthSpan, element.nextSibling);
  } else {
    element.classList.add('neutral');
  }
}

function setupAnalyticsRefresh() {
  // Initial load of analytics data
  initializeAnalyticsDashboard();
  
  // Add a manual refresh button if it doesn't exist
  const analyticsView = document.getElementById('admin-analytics-view');
  if (analyticsView && !document.getElementById('refresh-analytics-btn')) {
    const refreshButton = document.createElement('button');
    refreshButton.id = 'refresh-analytics-btn';
    refreshButton.className = 'refresh-btn';
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
    refreshButton.addEventListener('click', () => {
      refreshButton.classList.add('rotating');
      initializeAnalyticsDashboard(true);
      setTimeout(() => refreshButton.classList.remove('rotating'), 1000);
    });
    
    // Add button to the analytics view header
    const analyticsHeader = analyticsView.querySelector('h3') || analyticsView.querySelector('.admin-panel');
    if (analyticsHeader) {
      analyticsHeader.parentNode.insertBefore(refreshButton, analyticsHeader.nextSibling);
    } else {
      analyticsView.insertBefore(refreshButton, analyticsView.firstChild);
    }
  }
  
  // Set up auto-refresh interval with dynamic timing based on visibility
  let refreshInterval;
  
  function startRefreshInterval() {
    // Clear any existing interval
    if (refreshInterval) clearInterval(refreshInterval);
    
    // Set up new interval - refresh every 5 minutes when visible
    refreshInterval = setInterval(() => {
      const analyticsView = document.getElementById('admin-analytics-view');
      if (analyticsView && !analyticsView.classList.contains('hidden')) {
        // Refresh without showing loading indicators during auto-refresh
        initializeAnalyticsDashboard(false);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
  
  // Start the refresh interval
  startRefreshInterval();
  
  // Reset interval when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const analyticsView = document.getElementById('admin-analytics-view');
      if (analyticsView && !analyticsView.classList.contains('hidden')) {
        // Immediate refresh when tab becomes visible
        initializeAnalyticsDashboard(false);
      }
      startRefreshInterval();
    }
  });
  function initializeRevenueChart() {
    const chartContainer = document.querySelector('#admin-analytics-view .chart-container');
    if (!chartContainer) {
      console.warn('Chart container not found in analytics view');
      return;
    }
  
    // Clear previous chart content
    chartContainer.innerHTML = '';
  
    // Create loading state
    chartContainer.innerHTML = '<div class="loading-spinner">Loading chart data...</div>';
  
    // Fetch the real data from your API
    fetchRevenueChartData()
      .then(data => {
        // Clear loading state
        chartContainer.innerHTML = '';
  
        // Create the chart container structure
        chartContainer.innerHTML = `
          <div class="revenue-chart-header">
            <h4>Weekly Revenue Trends</h4>
            <div class="chart-controls">
              <button id="weekly-chart-btn" class="chart-btn active">Weekly</button>
              <button id="monthly-chart-btn" class="chart-btn">Monthly</button>
            </div>
          </div>
          <div class="revenue-chart" id="revenue-chart"></div>
          <div class="chart-summary">
            <div class="summary-item">
              <span class="summary-label">Total</span>
              <span class="summary-value" id="chart-total"></span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Average</span>
              <span class="summary-value" id="chart-average"></span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Peak Day</span>
              <span class="summary-value" id="chart-peak"></span>
            </div>
          </div>
        `;
  
        // Initialize chart with weekly data
        renderRevenueChart(data.weeklyData);
        updateChartSummary(data.weeklyData);
  
        // Add event listeners for chart controls
        document.getElementById('weekly-chart-btn').addEventListener('click', function() {
          this.classList.add('active');
          document.getElementById('monthly-chart-btn').classList.remove('active');
          renderRevenueChart(data.weeklyData);
          updateChartSummary(data.weeklyData);
        });
  
        document.getElementById('monthly-chart-btn').addEventListener('click', function() {
          this.classList.add('active');
          document.getElementById('weekly-chart-btn').classList.remove('active');
          renderRevenueChart(data.monthlyData);
          updateChartSummary(data.monthlyData);
        });
      })
      .catch(error => {
        console.error('Error fetching chart data:', error);
        chartContainer.innerHTML = `
          <div class="error-message">
            Failed to load chart data. Please try again.
            <button id="retry-chart-btn" class="retry-btn">Retry</button>
          </div>
        `;
        document.getElementById('retry-chart-btn')?.addEventListener('click', initializeRevenueChart);
      });
  }
}
function fixRevenueChart() {
  console.log("Fixing revenue chart...");
  
  // Find the chart container
  const chartContainer = document.querySelector('#admin-analytics-view .chart-container');
  if (!chartContainer) {
    console.error("Chart container not found");
    return;
  }
  
  // Show loading state
  chartContainer.innerHTML = `
    <div style="width: 100%; height: 250px; display: flex; align-items: center; justify-content: center;">
      <div class="loading-spinner">Loading revenue data...</div>
    </div>
  `;
  
  // Fetch real data from your API
  fetchRevenueChartData()
    .then(chartData => {
      // Replace the existing content with a properly structured chart container
      chartContainer.innerHTML = `
        <div class="revenue-chart-container" style="width: 100%; height: 300px; background-color: white; border-radius: 4px; padding: 16px;">
          <div class="revenue-chart-header">
            <h4 style="margin-top: 0; margin-bottom: 12px;">Weekly Revenue Trends</h4>
            <div class="chart-controls">
              <button id="line-chart-btn" class="chart-btn active">Line</button>
              <button id="bar-chart-btn" class="chart-btn">Bar</button>
            </div>
          </div>
          <div id="revenue-chart" style="height: 200px; margin-bottom: 16px;"></div>
          <div class="chart-summary" style="display: flex; justify-content: space-between;">
            <div class="summary-item" style="display: flex; flex-direction: column; align-items: center;">
              <span class="summary-label" style="font-size: 0.875rem; color: #6b7280;">Total</span>
              <span id="chart-total" class="summary-value" style="font-size: 1.125rem; font-weight: 600;">0.0M₫</span>
            </div>
            <div class="summary-item" style="display: flex; flex-direction: column; align-items: center;">
              <span class="summary-label" style="font-size: 0.875rem; color: #6b7280;">Average</span>
              <span id="chart-average" class="summary-value" style="font-size: 1.125rem; font-weight: 600;">0.0M₫</span>
            </div>
            <div class="summary-item" style="display: flex; flex-direction: column; align-items: center;">
              <span class="summary-label" style="font-size: 0.875rem; color: #6b7280;">Peak</span>
              <span id="chart-peak" class="summary-value" style="font-size: 1.125rem; font-weight: 600;">None</span>
            </div>
          </div>
        </div>
      `;
      
      // Calculate summary statistics
      const total = chartData.values.reduce((sum, value) => sum + value, 0);
      const average = total / chartData.values.length;
      const peak = chartData.values.reduce((max, val, idx) => val > max.val ? {val, idx} : max, {val: 0, idx: -1});
      
      // Update summary values
      document.getElementById('chart-total').textContent = (total).toFixed(1) + 'M₫';
      document.getElementById('chart-average').textContent = (average).toFixed(1) + 'M₫';
      if (peak.idx >= 0) {
        document.getElementById('chart-peak').textContent = `${chartData.labels[peak.idx]} (${peak.val.toFixed(1)}M₫)`;
      }
      
      // Get the chart container
      const chartDiv = document.getElementById('revenue-chart');
      
      // Create canvas for the chart
      const canvas = document.createElement('canvas');
      canvas.id = 'revenue-line-chart';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      chartDiv.appendChild(canvas);
      
      // Set canvas dimensions
      canvas.width = chartDiv.clientWidth;
      canvas.height = chartDiv.clientHeight;
      
      // Get canvas context
      const ctx = canvas.getContext('2d');
      
      // Function to draw line chart
      function drawLineChart() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Chart dimensions
        const padding = {
          top: 20,
          right: 20,
          bottom: 30,
          left: 40
        };
        
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;
        
        // Determine the max value for scaling
        const maxValue = Math.max(...chartData.values) * 1.1; // Add 10% for visualization
        
        // Draw background grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // Draw horizontal grid lines
        for (let i = 0; i <= 5; i++) {
          const y = padding.top + (chartHeight * (1 - i / 5));
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(canvas.width - padding.right, y);
          ctx.stroke();
          
          // Add Y axis labels
          const value = (maxValue * i / 5).toFixed(1);
          ctx.fillStyle = '#6b7280';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(value + 'M₫', padding.left - 5, y + 3);
        }
        
        // Draw the X axis (thicker)
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const xAxisY = padding.top + chartHeight;
        ctx.moveTo(padding.left, xAxisY);
        ctx.lineTo(canvas.width - padding.right, xAxisY);
        ctx.stroke();
        
        // Draw X axis labels
        ctx.textAlign = 'center';
        ctx.fillStyle = '#6b7280';
        
        const xStep = chartWidth / (chartData.labels.length - 1);
        chartData.labels.forEach((label, i) => {
          const x = padding.left + i * xStep;
          ctx.fillText(label, x, xAxisY + 15);
        });
        
        // Draw the line
        ctx.strokeStyle = '#B32821';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Calculate points for the line
        const points = chartData.values.map((value, index) => {
          const x = padding.left + index * xStep;
          const y = padding.top + chartHeight * (1 - value / maxValue);
          return { x, y };
        });
        
        // Start the line
        ctx.moveTo(points[0].x, points[0].y);
        
        // Curved lines using bezier curves
        for (let i = 0; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        
        // Complete the line to the last point
        ctx.quadraticCurveTo(
          points[points.length - 2].x,
          points[points.length - 2].y,
          points[points.length - 1].x,
          points[points.length - 1].y
        );
        
        // Draw the line
        ctx.stroke();
        
        // Fill the area under the curve with translucent red
        ctx.lineTo(points[points.length - 1].x, xAxisY);  // Bottom right
        ctx.lineTo(points[0].x, xAxisY);                  // Bottom left
        ctx.closePath();
        ctx.fillStyle = 'rgba(179, 40, 33, 0.1)';
        ctx.fill();
        
        // Draw points on the line
        points.forEach((point, index) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#B32821';
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Add value above each point
          ctx.fillStyle = '#111827';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(chartData.values[index].toFixed(1) + 'M', point.x, point.y - 10);
        });
      }
      
      // Function to draw bar chart
      function drawBarChart() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Chart dimensions
        const padding = {
          top: 20,
          right: 20,
          bottom: 30,
          left: 40
        };
        
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;
        
        // Determine the max value for scaling
        const maxValue = Math.max(...chartData.values) * 1.1; // Add 10% for visualization
        
        // Draw background grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // Draw horizontal grid lines
        for (let i = 0; i <= 5; i++) {
          const y = padding.top + (chartHeight * (1 - i / 5));
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(canvas.width - padding.right, y);
          ctx.stroke();
          
          // Add Y axis labels
          const value = (maxValue * i / 5).toFixed(1);
          ctx.fillStyle = '#6b7280';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(value + 'M₫', padding.left - 5, y + 3);
        }
        
        // Draw the X axis (thicker)
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const xAxisY = padding.top + chartHeight;
        ctx.moveTo(padding.left, xAxisY);
        ctx.lineTo(canvas.width - padding.right, xAxisY);
        ctx.stroke();
        
        // Calculate bar width
        const barCount = chartData.labels.length;
        const barWidth = (chartWidth / barCount) * 0.7; // 70% of available width per bar
        const barSpacing = (chartWidth / barCount) * 0.3; // 30% spacing
        
        // Draw bars and labels
        chartData.values.forEach((value, index) => {
          const barHeight = (value / maxValue) * chartHeight;
          const x = padding.left + (index * (barWidth + barSpacing)) + (barSpacing / 2);
          const y = padding.top + chartHeight - barHeight;
          
          // Draw bar with gradient
          const gradient = ctx.createLinearGradient(x, y, x, xAxisY);
          gradient.addColorStop(0, '#B32821');      // Top - darker
          gradient.addColorStop(1, '#EEBFBF');  // Bottom - lighter
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          // Rounded top corners for the bars
          const radius = 4;
          ctx.moveTo(x, y + radius);
          ctx.lineTo(x, y + barHeight - radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.lineTo(x + barWidth - radius, y);
          ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
          ctx.lineTo(x + barWidth, xAxisY);
          ctx.lineTo(x, xAxisY);
          ctx.closePath();
          ctx.fill();
          
          // Draw X axis label
          ctx.textAlign = 'center';
          ctx.fillStyle = '#6b7280';
          ctx.font = '10px sans-serif';
          ctx.fillText(chartData.labels[index], x + barWidth / 2, xAxisY + 15);
          
          // Draw value above bar
          ctx.fillStyle = '#111827';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(value.toFixed(1) + 'M', x + barWidth / 2, y - 5);
        });
      }
      
      // Draw line chart by default
      drawLineChart();
      
      // Add event listeners to chart type buttons
      const lineChartBtn = document.getElementById('line-chart-btn');
      const barChartBtn = document.getElementById('bar-chart-btn');
      
      lineChartBtn.addEventListener('click', function() {
        lineChartBtn.classList.add('active');
        barChartBtn.classList.remove('active');
        drawLineChart();
      });
      
      barChartBtn.addEventListener('click', function() {
        barChartBtn.classList.add('active');
        lineChartBtn.classList.remove('active');
        drawBarChart();
      });
      
      console.log("Chart drawing completed with real data");
    })
    .catch(error => {
      console.error("Error fetching revenue chart data:", error);
      // Show error message and fallback to sample data
      chartContainer.innerHTML = `
        <div class="error-notification" style="margin-bottom: 10px;">
          Error loading revenue data. Showing sample data instead.
        </div>
        <div id="revenue-chart-container" style="width: 100%; height: 250px;"></div>
      `;
      
      // Use sample data as fallback
      renderChartWithSampleData();
    });
}

// Function to fetch revenue data from your MongoDB database
async function fetchRevenueChartData() {
  try {
    console.log("Fetching revenue data from database...");
    
    // Fetch delivered orders for the past 7 days
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const response = await fetch('/api/orders?status=delivered');
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.status}`);
    }
    
    const orders = await response.json();
    console.log(`Retrieved ${orders.length} orders for revenue chart`);
    
    // Process orders into daily revenue
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize daily data for the past 7 days
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      dailyData.push({
        date: new Date(date.setHours(0, 0, 0, 0)),
        day: dayNames[date.getDay()],
        revenue: 0
      });
    }
    
    // Sum order revenue by day
    orders.forEach(order => {
      if (order.status === 'delivered' && (order.delivered_at || order.updatedAt)) {
        const orderDate = new Date(order.delivered_at || order.updatedAt);
        
        // Find the matching day
        for (const dayData of dailyData) {
          const nextDay = new Date(dayData.date);
          nextDay.setDate(nextDay.getDate() + 1);
          
          if (orderDate >= dayData.date && orderDate < nextDay) {
            dayData.revenue += order.total_amount || 0;
            break;
          }
        }
      }
    });
    
    // Sort days to ensure Monday comes first
    dailyData.sort((a, b) => {
      const dayOrder = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };
      return dayOrder[a.day] - dayOrder[b.day];
    });
    
    // Convert revenue to millions for display
    const labels = dailyData.map(day => day.day);
    const values = dailyData.map(day => day.revenue / 1000000);
    
    return { labels, values };
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    throw error;
  }
}

// Fallback function to render chart with sample data
function renderChartWithSampleData() {
 
  
  // Create the chart with sample data
  const chartContainer = document.getElementById('revenue-chart-container');
  if (!chartContainer) return;
  
  // Create sample chart (simplified version)
  const canvas = document.createElement('canvas');
  canvas.width = chartContainer.clientWidth;
  canvas.height = chartContainer.clientHeight;
  chartContainer.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  
  // Draw simple bar chart
  const barWidth = canvas.width / sampleData.labels.length - 10;
  const maxValue = Math.max(...sampleData.values) * 1.1;
  const scale = (canvas.height - 40) / maxValue;
  
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  sampleData.labels.forEach((label, i) => {
    const value = sampleData.values[i];
    const x = i * (barWidth + 10) + 10;
    const barHeight = value * scale;
    const y = canvas.height - barHeight - 20;
    
    // Draw bar
    ctx.fillStyle = '#B32821';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Draw label
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + barWidth/2, canvas.height - 5);
    
    // Draw value
    ctx.fillText(value + 'M₫', x + barWidth/2, y - 5);
  });
}
function loadTopSellingItems() {
  console.log("Loading top-selling menu items...");
  
  // Find the performance metrics container
  const metricsContainer = document.querySelector('.performance-metrics');
  if (!metricsContainer) {
    console.error("Performance metrics container not found");
    return;
  }
  
  // Show loading state
  metricsContainer.innerHTML = `
    <div class="loading-spinner">Loading top-selling items...</div>
  `;
  
  // Fetch order data
  fetch('/api/orders?status=delivered')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
      return response.json();
    })
    .then(orders => {
      console.log(`Analyzing ${orders.length} orders for top-selling items`);
      
      // Process orders to count menu items
      const menuItemCounts = {};
      
      // Go through all orders
      orders.forEach(order => {
        // Only process delivered orders
        if (order.status === 'delivered' && Array.isArray(order.items)) {
          // Go through each item in the order
          order.items.forEach(item => {
            const itemName = item.menu_item_name;
            const quantity = item.quantity || 1;
            
            // Add to the count
            if (itemName) {
              if (!menuItemCounts[itemName]) {
                menuItemCounts[itemName] = 0;
              }
              menuItemCounts[itemName] += quantity;
            }
          });
        }
      });
      
      // Convert to array for sorting
      const menuItems = Object.keys(menuItemCounts).map(name => ({
        name: name,
        count: menuItemCounts[name]
      }));
      
      // Sort by count (highest first)
      menuItems.sort((a, b) => b.count - a.count);
      
      // Take top 5 (or fewer if there aren't 5)
      const topItems = menuItems.slice(0, 5);
      
      console.log("Top selling items:", topItems);
      
      // Clear the container
      metricsContainer.innerHTML = '';
      
      // Check if we have any items
      if (topItems.length === 0) {
        metricsContainer.innerHTML = `
          <div class="empty-state">
            No sales data available
          </div>
        `;
        return;
      }
      
      // Add each top item to the container
      topItems.forEach(item => {
        const metricCard = document.createElement('div');
        metricCard.className = 'metric-card';
        
        metricCard.innerHTML = `
          <div class="metric-value">${item.count}</div>
          <div class="metric-label">${item.name}</div>
        `;
        
        metricsContainer.appendChild(metricCard);
      });
      
      // Add some animation to make the cards pop in
      const cards = metricsContainer.querySelectorAll('.metric-card');
      cards.forEach((card, index) => {
        // Stagger the animations
        setTimeout(() => {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          
          // Force reflow
          void card.offsetWidth;
          
          // Animate in
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 100);
      });
    })
    .catch(error => {
      console.error("Error loading top-selling items:", error);
      
      // Show error state
      metricsContainer.innerHTML = `
        <div class="error-notification">
          Failed to load top-selling items. 
          <button onclick="loadTopSellingItems()" class="retry-btn">Retry</button>
        </div>
        
        <!-- Fallback to sample data -->
        <div class="metric-card">
          <div class="metric-value">24</div>
          <div class="metric-label">Phở Bò</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value">18</div>
          <div class="metric-label">Bánh Xèo</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value">17</div>
          <div class="metric-label">Bún Chả</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value">15</div>
          <div class="metric-label">Gỏi Cuốn</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-value">14</div>
          <div class="metric-label">Cà Phê Sữa Đá</div>
        </div>
      `;
    });
}

// Call the function when the analytics view is shown
function initializePerformanceMetrics() {
  // Add event listener to analytics button
  const analyticsBtn = document.getElementById('admin-analytics-btn');
  if (analyticsBtn) {
    analyticsBtn.addEventListener('click', function() {
      // Load top-selling items with a slight delay to ensure the view is visible
      setTimeout(loadTopSellingItems, 500);
    });
  }
  
  // Also add to the initializeAnalyticsDashboard function
  const originalInitFunc = window.initializeAnalyticsDashboard || function() {};
  window.initializeAnalyticsDashboard = function(showLoading) {
    originalInitFunc(showLoading);
    setTimeout(loadTopSellingItems, 500);
  };
  
  // Initial load if analytics view is already visible
  const analyticsView = document.getElementById('admin-analytics-view');
  if (analyticsView && !analyticsView.classList.contains('hidden')) {
    loadTopSellingItems();
  }
}
// Start refreshing when page loads
document.addEventListener('DOMContentLoaded', setupOrderRefresh);