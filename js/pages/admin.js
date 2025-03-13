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
  
  // Initialize functionality
  setupTabButtons();
  setupTableButtons();
  
  // Set up logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
  }
});

// Set up tab buttons for admin dashboard
function setupTabButtons() {
  console.log("Setting up admin tab buttons");
  
  // DOM Elements for Admin Page
  const adminStaffBtn = document.getElementById('admin-staff-btn');
  const adminKitchenBtn = document.getElementById('admin-kitchen-btn');
  const adminAnalyticsBtn = document.getElementById('admin-analytics-btn');
  const adminStaffView = document.getElementById('admin-staff-view');
  const adminKitchenView = document.getElementById('admin-kitchen-view');
  const adminAnalyticsView = document.getElementById('admin-analytics-view');
  
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

// Sample order data for demonstration
const tableOrders = {
  // Table 2 has an active order
  "2": {
    order_id: 1002,
    status: 'preparing',
    created_at: '2023-03-13T12:30:00',
    items: [
      { menu_item_name: 'Gỏi Cuốn', quantity: 1, special_instructions: '' },
      { menu_item_name: 'Bánh Xèo', quantity: 1, special_instructions: 'No shrimp, extra vegetables' }
    ]
  },
  // Table 3 has a pending order
  "3": {
    order_id: 1001,
    status: 'pending',
    created_at: '2023-03-13T12:45:00',
    items: [
      { menu_item_name: 'Phở Bò', quantity: 2, special_instructions: 'Extra bean sprouts' },
      { menu_item_name: 'Bún Chả', quantity: 1, special_instructions: '' },
      { menu_item_name: 'Cà Phê Sữa Đá', quantity: 3, special_instructions: '' }
    ]
  }
};
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
  }}


// First, let's fix the closePopup function
function closePopup() {
  const popup = document.getElementById('table-popup');
  if (popup) popup.remove();
}

/// Now, let's improve the showTableOrderPopup function to correctly filter active orders
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
    
    // Create button based on status
    let actionButton = '';
    if (orderData.status === 'pending') {
      actionButton = `<button id="start-prep-btn" data-id="${orderData.order_id}" class="primary" style="background-color: #a83232; color: white; border: none; border-radius: 4px; padding: 0.75rem 1.5rem; cursor: pointer; font-weight: 600;">Start Preparing</button>`;
    } else if (orderData.status === 'preparing') {
      actionButton = `<button id="mark-ready-btn" data-id="${orderData.order_id}" class="primary" style="background-color: #a83232; color: white; border: none; border-radius: 4px; padding: 0.75rem 1.5rem; cursor: pointer; font-weight: 600;">Mark as Ready</button>`;
    } else if (orderData.status === 'ready') {
      actionButton = `<button id="mark-delivered-btn" data-id="${orderData.order_id}" class="primary" style="background-color: #a83232; color: white; border: none; border-radius: 4px; padding: 0.75rem 1.5rem; cursor: pointer; font-weight: 600;">Mark as Delivered</button>`;
    }
    
    // Create popup HTML
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
  
  <div style="padding: 0 1rem 1rem; border-bottom: 1px solid #eee;">
    ${orderData.items.map(item => {
      const specialInstructions = item.special_instructions 
        ? `<span style="background-color: #fff7ed; color: #f59e0b; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; display: inline-block; margin-left: 0.5rem;">${item.special_instructions}</span>` 
        : '';
      return `<div style="padding: 0.5rem 0; border-bottom: 1px dashed #eee;"><strong>${item.quantity}x</strong> ${item.menu_item_name} ${specialInstructions}</div>`;
    }).join('')}
  </div>
  
  <div style="padding: 1rem; text-align: right;">
    ${actionButton}
  </div>
</div>
`;
    
    // Add popup to document
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // Add event listeners for all actions
    document.addEventListener('click', function popupClickHandler(event) {
      // Close button handler
      if (event.target && event.target.id === 'close-popup') {
        closePopup();
        document.removeEventListener('click', popupClickHandler);
      }
      
      // Start Preparing button handler
      if (event.target && event.target.id === 'start-prep-btn') {
        const orderId = event.target.getAttribute('data-id');
        updateOrderStatusAcrossViews(orderId, 'preparing');
        closePopup();
        document.removeEventListener('click', popupClickHandler);
      }
      
      // Mark as Ready button handler
      if (event.target && event.target.id === 'mark-ready-btn') {
        const orderId = event.target.getAttribute('data-id');
        updateOrderStatusAcrossViews(orderId, 'ready');
        closePopup();
        document.removeEventListener('click', popupClickHandler);
      }
      
      // Mark as Delivered button handler
      if (event.target && event.target.id === 'mark-delivered-btn') {
        const orderId = event.target.getAttribute('data-id');
        updateOrderStatusAcrossViews(orderId, 'delivered');
        closePopup();
        document.removeEventListener('click', popupClickHandler);
      }
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
          <button id="create-order-btn" class="primary" style="background-color: #a83232; color: white; border: none; border-radius: 4px; padding: 0.75rem 1.5rem; cursor: pointer; font-weight: 600;">Create New Order</button>
        </div>
      </div>
    `;
    
    // Add popup to document
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // Add event listeners using event delegation
    document.addEventListener('click', function popupClickHandler(event) {
      if (event.target && event.target.id === 'close-popup') {
        closePopup();
        // Remove this event listener once popup is closed
        document.removeEventListener('click', popupClickHandler);
      }
      
      if (event.target && event.target.id === 'create-order-btn') {
        window.location.href = `customer.html?table=${tableNumber}&admin=true`;
      }
    });
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