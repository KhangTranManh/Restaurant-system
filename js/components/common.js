// Common functionality shared across all pages

// Load header component when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded - common.js running");
  const headerContainer = document.getElementById('header-container');
  
  if (headerContainer) {
    console.log("Loading header into container");
    // Use absolute path for header.html
    fetch('/views/header.html')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load header: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(html => {
        headerContainer.innerHTML = html;
        console.log("Header loaded successfully");
        setupHeaderControls();
      })
      .catch(error => {
        console.error('Error loading header:', error);
        headerContainer.innerHTML = '<div style="color:red;padding:20px;">Error loading header component</div>';
      });
  } else {
    console.warn("No header container found on this page");
  }

  // Set up global error handler for fetch operations
  setupGlobalErrorHandling();
});
  
// Setup header controls
function setupHeaderControls() {
  try {
    console.log("Setting up header controls");
    
    const customerBtn = document.getElementById('customer-btn');
    const staffBtn = document.getElementById('staff-btn');
    const kitchenBtn = document.getElementById('kitchen-btn');
    const adminBtn = document.getElementById('admin-btn');
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Check if elements exist before proceeding
    if (!userInfo || !logoutBtn) {
      console.warn("User info or logout button not found");
      // Continue with what we have - don't return early
    }
    
    // Load current user
    let currentUser = null;
    try {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        currentUser = JSON.parse(userJson);
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
      // Clear corrupted data
      localStorage.removeItem('currentUser');
    }
    
    // Update user info display
    if (userInfo) {
      if (currentUser) {
        userInfo.textContent = `${currentUser.name || 'User'} (${currentUser.role || 'unknown'})`;
        if (logoutBtn) logoutBtn.classList.remove('hidden');
      } else {
        userInfo.textContent = 'Guest';
        if (logoutBtn) logoutBtn.classList.add('hidden');
      }
    }
    
    // Add event listeners to role buttons if they exist
    if (customerBtn) {
      customerBtn.addEventListener('click', () => {
        window.location.href = '/views/customer.html';
      });
    }
    
    if (staffBtn) {
      staffBtn.addEventListener('click', () => {
        // Check if user has staff access
        if (currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin')) {
          window.location.href = '/views/staff.html';
        } else {
          window.location.href = '/views/login.html';
        }
      });
    }
    
    if (kitchenBtn) {
      kitchenBtn.addEventListener('click', () => {
        // Check if user has kitchen access
        if (currentUser && (currentUser.role === 'kitchen' || currentUser.role === 'admin')) {
          window.location.href = '/views/kitchen.html';
        } else {
          window.location.href = '/views/login.html';
        }
      });
    }
    
    // Admin button
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        // Check if user has admin access
        if (currentUser && currentUser.role === 'admin') {
          window.location.href = '/views/admin.html';
        } else {
          window.location.href = '/views/login.html';
        }
      });
    }
    
    // Logout button
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        console.log("Logging out");
        // Clear user data
        localStorage.removeItem('currentUser');
        
        // Redirect to login page
        window.location.href = '/views/login.html';
      });
    }
    
    // Setup role buttons based on user role
    if (currentUser) {
      setupRoleButtons(currentUser.role);
    }
  } catch (error) {
    console.error("Error in setupHeaderControls:", error);
  }
}
  
// Setup role buttons based on user role
function setupRoleButtons(userRole) {
  try {
    console.log(`Setting up role buttons for role: ${userRole}`);
    
    const customerBtn = document.getElementById('customer-btn');
    const staffBtn = document.getElementById('staff-btn');
    const kitchenBtn = document.getElementById('kitchen-btn');
    const adminBtn = document.getElementById('admin-btn');
    
    // Check if buttons exist
    if (!customerBtn && !staffBtn && !kitchenBtn) {
      console.warn("No role buttons found - header may not be loaded yet");
      return; // Header not loaded yet
    }
    
    // Update each button if it exists
    if (customerBtn) {
      customerBtn.classList.remove('active');
      customerBtn.style.display = 'block';
    }
    
    if (staffBtn) {
      staffBtn.classList.remove('active');
      staffBtn.style.display = 'block';
    }
    
    if (kitchenBtn) {
      kitchenBtn.classList.remove('active');
      kitchenBtn.style.display = 'block';
    }
    
    // Add admin button handling if it exists
    if (adminBtn) {
      adminBtn.classList.remove('active');
      adminBtn.style.display = 'block';
    }
    
    // Set active button and visibility based on role
    switch (userRole) {
      case 'customer':
        if (customerBtn) customerBtn.classList.add('active');
        break;
      case 'staff':
        if (staffBtn) staffBtn.classList.add('active');
        // Hide kitchen button for staff
        if (kitchenBtn) kitchenBtn.style.display = 'none';
        break;
      case 'kitchen':
        if (kitchenBtn) kitchenBtn.classList.add('active');
        // Hide staff button for kitchen
        if (staffBtn) staffBtn.style.display = 'none';
        break;
      case 'admin':
        // For admin, keep all buttons visible but none active
        if (adminBtn) {
          adminBtn.classList.add('active');
        }
        break;
      default:
        console.warn(`Unhandled user role: ${userRole}`);
    }
  } catch (error) {
    console.error("Error in setupRoleButtons:", error);
  }
}

// Setup global error handling for fetch operations
function setupGlobalErrorHandling() {
  // Override fetch to add global error handling
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args)
      .catch(error => {
        console.error('Global fetch error interceptor:', error);
        // Still throw the error for the local catch handlers
        throw error;
      });
  };

  // Error handling for unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled Promise Rejection:', event.reason);
    // Prevent the default browser behavior
    event.preventDefault();
    
    // Show a user-friendly error message
    showErrorNotification('An unexpected error occurred. Please refresh the page.');
  });
}

// Helper function to show an error notification to the user
function showErrorNotification(message) {
  try {
    console.error('Error notification:', message);
    
    // Try to find or create an error display element
    let errorDisplay = document.getElementById('global-error-display');
    
    if (!errorDisplay) {
      // Create a new error display element
      errorDisplay = document.createElement('div');
      errorDisplay.id = 'global-error-display';
      errorDisplay.style.position = 'fixed';
      errorDisplay.style.top = '10px';
      errorDisplay.style.left = '50%';
      errorDisplay.style.transform = 'translateX(-50%)';
      errorDisplay.style.backgroundColor = '#f44336';
      errorDisplay.style.color = 'white';
      errorDisplay.style.padding = '12px 24px';
      errorDisplay.style.borderRadius = '4px';
      errorDisplay.style.zIndex = '9999';
      errorDisplay.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      
      // Add close button
      const closeBtn = document.createElement('span');
      closeBtn.textContent = '×';
      closeBtn.style.marginLeft = '10px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontWeight = 'bold';
      closeBtn.style.float = 'right';
      closeBtn.onclick = function() {
        document.body.removeChild(errorDisplay);
      };
      
      errorDisplay.appendChild(closeBtn);
      document.body.appendChild(errorDisplay);
    }
    
    // Set the error message
    errorDisplay.textContent = message;
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDisplay.parentNode) {
        errorDisplay.parentNode.removeChild(errorDisplay);
      }
    }, 5000);
  } catch (e) {
    // Fallback to alert if there's an error creating the notification
    console.error('Error creating notification:', e);
    alert(message);
  }
}

// Safe wrapper for socket.io connection
function safeSocketConnect() {
  try {
    if (typeof io !== 'undefined') {
      return io();
    } else {
      console.warn('Socket.io not available');
      return null;
    }
  } catch (e) {
    console.error('Error connecting to socket.io:', e);
    return null;
  }
}