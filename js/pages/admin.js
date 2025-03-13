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

// Set up table buttons in the admin staff view
function setupTableButtons() {
  console.log("Setting up admin table buttons");
  
  const tableButtons = document.querySelectorAll('.tables-grid button');
  if (!tableButtons) {
    console.error("Table buttons not found");
    return;
  }
  
  tableButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tableNumber = this.textContent.trim();
      showTableOrderPopup(tableNumber);
    });
  });
}

// Close the popup
function closePopup() {
  const popup = document.getElementById('table-popup');
  if (popup) popup.remove();
}

// Updated table orders function to sync with staff orders
function showTableOrderPopup(tableNumber) {
  console.log(`Showing popup for Table ${tableNumber}`);
  
  // Close any existing popups first
  const existingPopup = document.getElementById('table-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // Retrieve orders from localStorage (synced from staff view)
  const staffOrdersStr = localStorage.getItem('staffOrders');
  let staffOrders = [];
  
  try {
    if (staffOrdersStr) {
      staffOrders = JSON.parse(staffOrdersStr);
    }
  } catch (error) {
    console.error("Error parsing staff orders:", error);
  }
  
  // Find orders for this specific table
  const tableOrders = staffOrders.filter(order => 
    order.table_number == tableNumber && 
    order.status !== 'delivered' && 
    order.status !== 'cancelled'
  );
  
  // If no orders found, use the sample data as a fallback
  const orderData = tableOrders.length > 0 
    ? tableOrders[tableOrders.length - 1]  // Use the most recent order
    : tableOrders[tableNumber];
  
  if (orderData) {
    // Format the time
    const orderTime = new Date(orderData.created_at);
    const formattedTime = orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Create button based on status
    let actionButton = '';
    if (orderData.status === 'pending') {
      actionButton = `<button class="primary" style="background-color: #a83232; color: white; border: none; border-radius: 4px; padding: 0.75rem 1.5rem; cursor: pointer; font-weight: 600;">Start Preparing</button>`;
    } else if (orderData.status === 'preparing') {
      actionButton = `<button class="primary" style="background-color: #a83232; color: white; border: none; border-radius: 4px; padding: 0.75rem 1.5rem; cursor: pointer; font-weight: 600;">Mark as Ready</button>`;
    } else {
      actionButton = `<button class="primary" style="background-color: #a83232; color: white; border: none; border-radius: 4px; padding: 0.75rem 1.5rem; cursor: pointer; font-weight: 600;">Mark as Delivered</button>`;
    }
    
    // Create popup HTML
    const popupHTML = `
      <div id="table-popup" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); width: 90%; max-width: 400px; z-index: 1000;">
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
    
    // Add event listeners
    const closeButton = document.getElementById('close-popup');
    
    if (closeButton) {
      closeButton.addEventListener('click', closePopup);
    }
    
  } else {
    // No order for this table, show a simple message
    const popupHTML = `
      <div id="table-popup" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); width: 90%; max-width: 400px; z-index: 1000;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee;">
          <h3 style="margin: 0; font-size: 1.2rem;">Table ${tableNumber}</h3>
          <button id="close-popup" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>
        
        <div style="padding: 1.5rem; text-align: center;">
          <p style="margin-bottom: 1rem;">No active orders for this table.</p>
          <button class="primary" style="background-color: #a83232; color: white; border: none; border-radius: 4px; padding: 0.75rem 1.5rem; cursor: pointer; font-weight: 600;">Create New Order</button>
        </div>
      </div>
    `;
    
    // Add popup to document
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // Add event listeners
    const closeButton = document.getElementById('close-popup');
    
    if (closeButton) {
      closeButton.addEventListener('click', closePopup);
    }
  }
}

// Modify the staff order creation to sync with admin view
function syncStaffOrders(orders) {
  // Store orders in localStorage for admin view to access
  localStorage.setItem('staffOrders', JSON.stringify(orders));
}

// Event delegation for popup closing
document.addEventListener('click', function(event) {
  // Check if the clicked element is the close button
  if (event.target && event.target.id === 'close-popup') {
    closePopup();
  }
});