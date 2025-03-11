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
});
  
// Setup header controls
function setupHeaderControls() {
  console.log("Setting up header controls");
  
  const customerBtn = document.getElementById('customer-btn');
  const staffBtn = document.getElementById('staff-btn');
  const kitchenBtn = document.getElementById('kitchen-btn');
  const adminBtn = document.getElementById('admin-btn');
  const userInfo = document.getElementById('user-info');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (!customerBtn || !staffBtn || !kitchenBtn || !userInfo || !logoutBtn) {
    console.error("Some header elements could not be found!");
    return;
  }
  
  // Load current user
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  // Update user info display
  if (currentUser) {
    userInfo.textContent = `${currentUser.name} (${currentUser.role})`;
    logoutBtn.classList.remove('hidden');
  } else {
    userInfo.textContent = 'Guest';
    logoutBtn.classList.add('hidden');
  }
  
  // Add event listeners to role buttons
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
}
  
// Setup role buttons based on user role
function setupRoleButtons(userRole) {
  console.log(`Setting up role buttons for role: ${userRole}`);
  
  const customerBtn = document.getElementById('customer-btn');
  const staffBtn = document.getElementById('staff-btn');
  const kitchenBtn = document.getElementById('kitchen-btn');
  const adminBtn = document.getElementById('admin-btn');
  
  // Check if buttons exist
  if (!customerBtn || !staffBtn || !kitchenBtn) {
    console.warn("Role buttons not found");
    return; // Header not loaded yet
  }
  
  // Reset active state and visibility
  customerBtn.classList.remove('active');
  staffBtn.classList.remove('active');
  kitchenBtn.classList.remove('active');
  
  // Reset display to ensure buttons are visible
  customerBtn.style.display = 'block';
  staffBtn.style.display = 'block';
  kitchenBtn.style.display = 'block';
  
  // Add admin button handling if it exists
  if (adminBtn) {
    adminBtn.classList.remove('active');
    adminBtn.style.display = 'block';
  }
  
  // Set active button and visibility based on role
  switch (userRole) {
    case 'customer':
      customerBtn.classList.add('active');
      break;
    case 'staff':
      staffBtn.classList.add('active');
      // Hide kitchen button for staff
      kitchenBtn.style.display = 'none';
      break;
    case 'kitchen':
      kitchenBtn.classList.add('active');
      // Hide staff button for kitchen
      staffBtn.style.display = 'none';
      break;
    case 'admin':
      // For admin, keep all buttons visible but none active
      if (adminBtn) {
        adminBtn.style.display = 'block';
      }
      break;
    default:
      console.warn(`Unhandled user role: ${userRole}`);
  }
}

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled Promise Rejection:', event.reason);
  // Optionally show a user-friendly error message
  const errorDisplay = document.getElementById('global-error-display');
  if (errorDisplay) {
    errorDisplay.textContent = 'An unexpected error occurred. Please try again.';
    errorDisplay.classList.remove('hidden');
  } else {
    alert('An unexpected error occurred. Please try again.');
  }
});

// Export functions for potential testing or module usage
export {
  setupHeaderControls,
  setupRoleButtons
};