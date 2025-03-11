// Mock user database for authentication
const users = [
  { username: 'staff1', password: 'password123', name: 'Staff User', role: 'staff' },
  { username: 'kitchen1', password: 'password123', name: 'Kitchen User', role: 'kitchen' },
  { username: 'admin1', password: 'password123', name: 'Admin User', role: 'admin' }
];

// Enhanced logging function
function debugLog(message, data = null) {
  console.log(`[LOGIN DEBUG] ${message}`);
  if (data) {
    console.log(data);
  }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  debugLog("Login page loaded");
  
  // DOM Elements
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('login-error');
  const customerAccessBtn = document.getElementById('customer-access-btn');
  
  if (!loginForm || !usernameInput || !passwordInput || !loginError || !customerAccessBtn) {
    debugLog("Some login page elements could not be found!");
    return;
  }
  
  // Handle login form submission
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    debugLog(`Login attempt: ${username}`);
    
    // Authenticate user
    const user = users.find(user => 
      user.username === username && 
      user.password === password
    );
    
    if (user) {
      // Store user info in localStorage for persistence
      debugLog(`Successful login for: ${username} (${user.role})`);
      
      try {
        // Detailed localStorage logging
        const userToStore = {
          username: user.username,
          name: user.name,
          role: user.role
        };
        
        debugLog('Storing user in localStorage:', userToStore);
        localStorage.setItem('currentUser', JSON.stringify(userToStore));
        
        // Verify storage
        const storedUser = JSON.parse(localStorage.getItem('currentUser'));
        debugLog('Retrieved user from localStorage:', storedUser);
        
        // Detailed redirect logging
        debugLog(`Attempting to redirect for role: ${user.role}`);
        redirectToRolePage(user.role);
      } catch (error) {
        debugLog('Error during login process:', error);
        loginError.textContent = 'An error occurred during login.';
        loginError.style.display = 'block';
      }
    } else {
      // Show error message
      debugLog("Login failed: Invalid credentials");
      loginError.textContent = 'Invalid username or password.';
      loginError.style.display = 'block';
    }
  });
  
  // Customer access button
  customerAccessBtn.addEventListener('click', function() {
    debugLog("Customer access requested");
    // Clear any existing user data
    localStorage.removeItem('currentUser');
    
    // Set role to customer
    const customerUser = {
      username: 'guest',
      name: 'Guest User',
      role: 'customer'
    };
    
    debugLog('Storing customer user:', customerUser);
    localStorage.setItem('currentUser', JSON.stringify(customerUser));
    
    // Redirect to customer page
    window.location.href = 'customer.html';
  });
  
  // Check if user is already logged in
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  if (currentUser) {
    debugLog(`Already logged in as: ${currentUser.username} (${currentUser.role})`);
    // User is already logged in, redirect to appropriate page
    redirectToRolePage(currentUser.role);
  }
});

// Redirect based on role
function redirectToRolePage(role) {
  debugLog(`Redirecting to role page: ${role}`);
  
  switch(role) {
    case 'staff':
      window.location.href = 'staff.html';
      break;
    case 'kitchen':
      window.location.href = 'kitchen.html';
      break;
    case 'admin':
      window.location.href = 'admin.html';
      break;
    default:
      debugLog(`Unexpected role: ${role}, redirecting to customer page`);
      window.location.href = 'customer.html';
  }
}