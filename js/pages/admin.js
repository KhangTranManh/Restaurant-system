// admin.js - Updated for the Vietnam Cuisine theme

// Check authentication and initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
  console.log("Admin page loaded");
  
  // Check authentication
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
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
  
  setupTabButtons();
  setupTableButtons();
  setupManagementButtonsAndSections();
  setupAutoRefresh();
  
  // Set up logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
  }
  
  // First hide the management view
  const adminManagementView = document.getElementById('admin-management-view');
  if (adminManagementView) {
    adminManagementView.style.display = 'none';
    adminManagementView.classList.add('hidden');
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
  
  // Staff view button
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

// Modified function to show table order popup without action buttons
function showTableOrderPopup(tableNumber, tableOrders) {
  console.log(`Showing popup for Table ${tableNumber}`);
  
  // Close any existing popups first
  const existingPopup = document.getElementById('table-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
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
        <h3 style="margin: 0; font-size: 1.2rem;">Order #${orderData.order_id}</h3>
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
    
    // Add event listener for close button - directly on the button for better reliability
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
    
    // Add event listener for close button - directly on the button for better reliability
    document.getElementById('close-popup').addEventListener('click', function() {
      closePopup();
    });
  }
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
// Here's the improved setupTableButtons function
function setupTableButtons() {
  console.log("Setting up admin table buttons");
  
  const tableButtons = document.querySelectorAll('.tables-grid button');
  if (!tableButtons) {
    console.error("Table buttons not found");
    return;
  }
  
  tableButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Get table number from text content (the button's inner text)
      const tableNumber = this.textContent.trim();
      console.log(`Admin: Table ${tableNumber} clicked`);
      
      // Try to get orders from localStorage
      try {
        const ordersStr = localStorage.getItem('allOrders');
        if (ordersStr) {
          const allOrders = JSON.parse(ordersStr);
          console.log(`Found ${allOrders.length} orders in localStorage`);
          
          // Filter for this table
          const tableOrders = allOrders.filter(order => 
            order.table_number.toString() === tableNumber.toString()
          );
          
          console.log(`Found ${tableOrders.length} orders for table ${tableNumber}`);
          showTableOrderPopup(tableNumber, tableOrders);
        } else {
          console.log("No orders found in localStorage");
          showTableOrderPopup(tableNumber, []);
        }
      } catch (error) {
        console.error("Error getting orders:", error);
        showTableOrderPopup(tableNumber, []);
      }
    });
  });
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

// Helper function to format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

// Call this at the end of your admin.js initialization to directly access staff.js data
document.addEventListener('DOMContentLoaded', function() {
  // Add this line to your existing initialization code
  console.log("Admin page initialized, looking for staff data");
  
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
  updateAdminTableStatus();
});