
// login.js - Modified to use the MongoDB API

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
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    debugLog(`Login attempt: ${username}`);
    
    try {
      // Send login request to API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid username or password');
      }
      
      // Store user info in localStorage for persistence
      debugLog(`Successful login for: ${username} (${data.role})`);
      
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('currentUser', JSON.stringify({
        username: data.username,
        name: data.name,
        role: data.role
      }));
      
      // Redirect based on role
      redirectToRolePage(data.role);
      
    } catch (error) {
      // Show error message
      debugLog("Login failed:", error.message);
      loginError.textContent = error.message;
      loginError.style.display = 'block';
    }
  });
  
  // Customer access button
  customerAccessBtn.addEventListener('click', function() {
    debugLog("Customer access requested");
    // Clear any existing user data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    
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
  const token = localStorage.getItem('token');
  
  if (currentUser && token) {
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