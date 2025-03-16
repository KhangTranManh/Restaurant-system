// manager.js - Handles only the management functionality for Vietnam Cuisine

document.addEventListener('DOMContentLoaded', function() {
  console.log("Manager.js: Management functionality initialized");
  
  // Set up the management button to show management view
  const adminManagementBtn = document.getElementById('admin-management-btn');
  if (adminManagementBtn) {
    adminManagementBtn.addEventListener('click', function() {
      showManagementView();
    });
  }
  
  // Initialize management sections
  initializeManagementSections();
  
  // Set up navigation within management sections
  setupManagementNavigation();
  
  // Initialize modals for the management section
  setupModalControls();
});

// Function to show the management view
function showManagementView() {
  // Hide all other panels
  const adminPanels = document.querySelectorAll('.admin-panel');
  adminPanels.forEach(panel => {
    panel.classList.add('hidden');
  });
  
  // Show management view
  const managementView = document.getElementById('admin-management-view');
  if (managementView) {
    managementView.classList.remove('hidden');
  }
  
  // Load dashboard stats
  loadDashboardStats();
  
  // Update button styles
  updateButtonStyles();
}

// Update the top navigation button styles
function updateButtonStyles() {
  const buttons = document.querySelectorAll('.toggle-buttons button');
  buttons.forEach(button => {
    button.classList.add('secondary');
    button.classList.remove('primary');
  });
  
  const managementBtn = document.getElementById('admin-management-btn');
  if (managementBtn) {
    managementBtn.classList.add('primary');
    managementBtn.classList.remove('secondary');
  }
}

// Initialize management sections
function initializeManagementSections() {
  // Set up staff management
  initStaffManagement();
  
  // Set up menu management
  initMenuManagement();
  
  // Set up user management
  initUserManagement();
  
  // Set up settings management
  initSettingsManagement();
  
  // Load initial data
  loadDashboardStats();
}

// Load dashboard statistics from MongoDB
function loadDashboardStats() {
  try {
    // Staff stats - fetch from MongoDB
    fetch('/api/users/stats')
      .then(response => response.json())
      .then(stats => {
        // Update staff stats
        document.getElementById('total-staff-count').textContent = stats.totalStaff || 0;
        document.getElementById('kitchen-staff-count').textContent = stats.kitchenStaff || 0;
        document.getElementById('active-users-count').textContent = stats.activeUsers || 0;
        document.getElementById('admin-users-count').textContent = stats.adminUsers || 0;
      })
      .catch(error => {
        console.error("Error loading staff stats:", error);
      });
    
    // Menu stats - fetch from MongoDB
    fetch('/api/menu/stats')
      .then(response => response.json())
      .then(stats => {
        // Update menu stats
        document.getElementById('menu-items-count').textContent = stats.totalItems || 0;
        document.getElementById('menu-categories-count').textContent = stats.categories || 0;
      })
      .catch(error => {
        console.error("Error loading menu stats:", error);
      });
    
    // Settings stats - fetch from MongoDB
    fetch('/api/settings')
      .then(response => response.json())
      .then(settings => {
        // Update settings stats
        document.getElementById('tables-count').textContent = settings.tableCount || 8;
        document.getElementById('tax-rate-display').textContent = `${settings.taxRate || 10}%`;
      })
      .catch(error => {
        console.error("Error loading settings:", error);
        
        // Fallback to localStorage if API fails
        const localSettings = JSON.parse(localStorage.getItem('restaurantSettings')) || { tableCount: 8, taxRate: 10 };
        document.getElementById('tables-count').textContent = localSettings.tableCount || 8;
        document.getElementById('tax-rate-display').textContent = `${localSettings.taxRate || 10}%`;
      });
    
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
  }
}
// Function to set up management navigation
function setupManagementNavigation() {
  // Staff management button
  const manageStaffBtn = document.getElementById('manage-staff-btn');
  if (manageStaffBtn) {
    manageStaffBtn.addEventListener('click', function() {
      hideAllSections();
      displayStaffSection();
    });
  }
  
  // Menu management button
  const manageMenuBtn = document.getElementById('manage-menu-btn');
  if (manageMenuBtn) {
    manageMenuBtn.addEventListener('click', function() {
      hideAllSections();
      displayMenuSection();
    });
  }
  
  // User management button
  const manageUsersBtn = document.getElementById('manage-users-btn');
  if (manageUsersBtn) {
    manageUsersBtn.addEventListener('click', function() {
      hideAllSections();
      displayUserSection();
    });
  }
  
  // Settings management button
  const manageSettingsBtn = document.getElementById('manage-settings-btn');
  if (manageSettingsBtn) {
    manageSettingsBtn.addEventListener('click', function() {
      hideAllSections();
      displaySettingsSection();
    });
  }
  
  // Back buttons
  setupBackButtons();
}
// Function to update navigation button styles
function updateNavButtons() {
  // Get all navigation buttons
  const navButtons = document.querySelectorAll('.top-nav-buttons button, .toggle-buttons button');
  
  // Remove active class from all buttons first
  navButtons.forEach(button => {
    button.classList.remove('active', 'primary');
    button.classList.add('secondary');
  });
  
  // Determine which view is currently visible and highlight that button
  if (!document.getElementById('admin-management-view').classList.contains('hidden')) {
    // Management view is active
    const managementBtn = document.getElementById('admin-management-btn');
    if (managementBtn) {
      managementBtn.classList.add('primary');
      managementBtn.classList.remove('secondary');
    }
  } else if (!document.getElementById('admin-analytics-view').classList.contains('hidden')) {
    // Analytics view is active
    const analyticsBtn = document.getElementById('admin-analytics-btn');
    if (analyticsBtn) {
      analyticsBtn.classList.add('primary');
      analyticsBtn.classList.remove('secondary');
    }
  }
  // Add more conditions for other views as needed
}
// Hide all management sections
function hideAllSections() {
  // Hide admin management view
  document.getElementById('admin-management-view').classList.add('hidden');
  
  // Hide all management sections
  const sections = document.querySelectorAll('.management-section');
  sections.forEach(section => {
    section.classList.add('hidden');
  });
  
  // Hide any other sections that might be showing
  const otherSections = document.querySelectorAll('[id$="-management"]');
  otherSections.forEach(section => {
    if (!section.classList.contains('management-section')) {
      section.classList.add('hidden');
    }
  });
  
  // Close any open modals
  closeModal();
  updateNavButtons();

}


// Display staff management section
function displayStaffSection() {
  hideAllSections();
  
  const staffSection = document.getElementById('staff-management-section');
  if (staffSection) {
    staffSection.classList.remove('hidden');
    
    // Refresh staff list
    displayStaffList();
  }
}

// Display menu management section
function displayMenuSection() {
  hideAllSections();
  
  const menuSection = document.getElementById('menu-management-section');
  if (menuSection) {
    menuSection.classList.remove('hidden');
    
    // Refresh menu items
    displayMenuItems();
  }
}

// Display staff management section
function displayStaffSection() {
  const staffSection = document.getElementById('staff-management-section');
  if (staffSection) {
    staffSection.classList.remove('hidden');
    
    // Refresh staff list
    displayStaffList();
  }
}

// Display menu management section
function displayMenuSection() {
  const menuSection = document.getElementById('menu-management-section');
  if (menuSection) {
    menuSection.classList.remove('hidden');
    
    // Refresh menu items
    displayMenuItems();
  }
}

// Display user management section
function displayUserSection() {
  const userSection = document.getElementById('user-management-section');
  if (userSection) {
    userSection.classList.remove('hidden');
    
    // Refresh user list
    displayUsers();
  }
}

// Display settings management section
function displaySettingsSection() {
  const settingsSection = document.getElementById('settings-management-section');
  if (settingsSection) {
    settingsSection.classList.remove('hidden');
    
    // Load settings into forms
    loadSettingsData();
  }
}

// Setup back buttons for all management sections
function setupBackButtons() {
  // All back buttons
  const backButtons = document.querySelectorAll('[id^="back-to-management"]');
  backButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Hide all section content
      const sections = document.querySelectorAll('.management-section');
      sections.forEach(section => {
        section.classList.add('hidden');
      });
      
      // Show admin management view
      const managementView = document.getElementById('admin-management-view');
      if (managementView) {
        managementView.classList.remove('hidden');
        
        // Refresh dashboard stats
        loadDashboardStats();
      }
    });
  });
}

// ------------ STAFF MANAGEMENT WITH MONGODB ------------

// Initialize staff management with MongoDB connection
function initStaffManagement() {
  // Add staff button
  const addStaffBtn = document.getElementById('add-staff-btn');
  if (addStaffBtn) {
    addStaffBtn.addEventListener('click', function() {
      openStaffModal();
    });
  }
  
  // Save staff button
  const saveStaffBtn = document.getElementById('save-staff-btn');
  if (saveStaffBtn) {
    saveStaffBtn.addEventListener('click', function() {
      saveStaffData();
    });
  }
  
  // Load staff data on initialization
  displayStaffList();
}

// Display staff list from MongoDB
function displayStaffList() {
  const staffTableBody = document.getElementById('staff-table-body');
  if (!staffTableBody) return;
  
  // Clear the table
  staffTableBody.innerHTML = '';
  
  // Fetch staff data from server
  fetch('/api/users?role=staff,kitchen,admin')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(users => {
      // Add each staff member to the table
      users.forEach(user => {
        const row = document.createElement('tr');
        
        // Format role with first letter capitalized
        const formattedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        
        // Status badge - assuming all users in database are active
        const statusBadge = '<span class="badge green small">Active</span>';
        
        row.innerHTML = `
          <td>${user.name}</td>
          <td>${formattedRole}</td>
          <td>${user.contact || 'N/A'}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="icon-button edit-staff-btn" data-id="${user._id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="icon-button delete-staff-btn" data-id="${user._id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        
        staffTableBody.appendChild(row);
      });
      
      // Setup edit and delete buttons
      setupStaffButtons();
    })
    .catch(error => {
      console.error("Error fetching staff data:", error);
      staffTableBody.innerHTML = '<tr><td colspan="5">Error loading staff data. Please try again.</td></tr>';
    });
}

// Setup staff action buttons
function setupStaffButtons() {
  // Edit staff buttons
  const editButtons = document.querySelectorAll('.edit-staff-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', function() {
      const staffId = this.getAttribute('data-id');
      openStaffModal(staffId);
    });
  });
  
  // Delete staff buttons
  const deleteButtons = document.querySelectorAll('.delete-staff-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
      const staffId = this.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this staff member?')) {
        deleteStaff(staffId);
      }
    });
  });
}

// Open staff modal
function openStaffModal(staffId = null) {
  // Reset form
  document.getElementById('staff-form').reset();
  
  const modalTitle = document.getElementById('staff-modal-title');
  
  // Update role dropdown to only include valid roles
  const roleSelect = document.getElementById('staff-role');
  roleSelect.innerHTML = `
  <option value="">Select a role</option>
  <option value="staff">Staff</option>
  <option value="kitchen">Kitchen</option>
  <option value="admin">Admin</option>
`;
  
  if (staffId) {
    // Edit mode
    modalTitle.textContent = 'Edit Staff';
    
    // Add password field to the modal if not already present
    if (!document.getElementById('staff-password')) {
      const contactField = document.getElementById('staff-contact');
      const passwordDiv = document.createElement('div');
      passwordDiv.className = 'form-group';
      passwordDiv.innerHTML = `
        <label for="staff-password">Password (leave blank to keep current)</label>
        <input type="password" id="staff-password">
      `;
      contactField.parentNode.insertBefore(passwordDiv, contactField.nextSibling);
    }
    
    // Add username field to the modal if not already present
    if (!document.getElementById('staff-username')) {
      const nameField = document.getElementById('staff-name');
      const usernameDiv = document.createElement('div');
      usernameDiv.className = 'form-group';
      usernameDiv.innerHTML = `
        <label for="staff-username">Username</label>
        <input type="text" id="staff-username" required>
      `;
      nameField.parentNode.insertBefore(usernameDiv, nameField.nextSibling);
    }
    
    // Fetch staff data from server
    fetch(`/api/users/${staffId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(user => {
        // Fill form with staff data
        document.getElementById('staff-name').value = user.name || '';
        document.getElementById('staff-username').value = user.username || '';
        document.getElementById('staff-role').value = user.role || '';
        document.getElementById('staff-contact').value = user.contact || '';
        document.getElementById('staff-status').value = 'active'; // Assuming all users are active
        
        // Store ID for later use
        document.getElementById('staff-form').setAttribute('data-id', staffId);
      })
      .catch(error => {
        console.error("Error loading staff data:", error);
        alert('Failed to load staff data. Please try again.');
      });
  } else {
    // Add mode
    modalTitle.textContent = 'Add New Staff';
    
    // Add password field to the modal if not already present
    if (!document.getElementById('staff-password')) {
      const contactField = document.getElementById('staff-contact');
      const passwordDiv = document.createElement('div');
      passwordDiv.className = 'form-group';
      passwordDiv.innerHTML = `
        <label for="staff-password">Password</label>
        <input type="password" id="staff-password" required>
      `;
      contactField.parentNode.insertBefore(passwordDiv, contactField.nextSibling);
    }
    
    // Add username field to the modal if not already present
    if (!document.getElementById('staff-username')) {
      const nameField = document.getElementById('staff-name');
      const usernameDiv = document.createElement('div');
      usernameDiv.className = 'form-group';
      usernameDiv.innerHTML = `
        <label for="staff-username">Username</label>
        <input type="text" id="staff-username" required>
      `;
      nameField.parentNode.insertBefore(usernameDiv, nameField.nextSibling);
    }
    
    document.getElementById('staff-form').removeAttribute('data-id');
  }
  
  // Show modal
  showModal('staff-modal');
}

// Save staff data to MongoDB
function saveStaffData() {
  console.log("Save staff button clicked");
  const form = document.getElementById('staff-form');
  
  // Basic validation
  if (!form.checkValidity()) {
    alert('Please fill all required fields.');
    return;
  }
  
  // Get form data
  const name = document.getElementById('staff-name').value;
  const username = document.getElementById('staff-username').value;
  const password = document.getElementById('staff-password').value;
  const role = document.getElementById('staff-role').value;
  const contact = document.getElementById('staff-contact').value;
  const status = document.getElementById('staff-status').value || 'active';
  
  const staffId = form.getAttribute('data-id');
  
  // Prepare data for API call
  const userData = {
    name,
    username,
    role,
    contact,
    status
  };
  
  // Add password only if provided (for edit mode) or required (for add mode)
  if (password) {
    userData.password = password;
  }
  
  // API endpoint and method based on add/edit mode
  const url = staffId ? `/api/users/${staffId}` : '/api/users';
  const method = staffId ? 'PUT' : 'POST';
  
  console.log("Sending request to:", url);
  console.log("Request data:", userData);
  
  // Make API call to save data
  fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error('Network response was not ok: ' + text);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log("Success:", data);
      // Close modal and refresh list
      closeModal();
      displayStaffList();
      
      // Update dashboard stats
      loadDashboardStats();
    })
    .catch(error => {
      console.error("Error saving staff data:", error);
      alert('An error occurred while saving the staff data: ' + error.message);
    });
}

// Delete staff from MongoDB
function deleteStaff(staffId) {
  // Make API call to delete staff
  fetch(`/api/users/${staffId}`, {
    method: 'DELETE'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Refresh list
      displayStaffList();
      
      // Update dashboard stats
      loadDashboardStats();
    })
    .catch(error => {
      console.error("Error deleting staff:", error);
      alert('An error occurred while deleting the staff member.');
    });
}

// ------------ MENU MANAGEMENT ------------

/// Initialize menu management with MongoDB
function initMenuManagement() {
  // Add menu item button
  const addMenuItemBtn = document.getElementById('add-menu-item-btn');
  if (addMenuItemBtn) {
    addMenuItemBtn.addEventListener('click', function() {
      openMenuItemModal();
    });
  }
  
  // Save menu item button
  const saveMenuItemBtn = document.getElementById('save-menu-item-btn');
  if (saveMenuItemBtn) {
    saveMenuItemBtn.addEventListener('click', function() {
      saveMenuItemData();
    });
  }
  
  // Load menu items on initialization
  displayMenuItems();
}

// Display menu items from MongoDB
function displayMenuItems() {
  const menuTableBody = document.getElementById('menu-table-body');
  if (!menuTableBody) return;
  
  // Clear the table
  menuTableBody.innerHTML = '';
  
  // Fetch menu data from server
  fetch('/api/menu/items')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(menuItems => {
      // Add each menu item to the table
      menuItems.forEach(item => {
        const row = document.createElement('tr');
        
        // Format price
        const formattedPrice = new Intl.NumberFormat('vi-VN').format(item.price) + '₫';
        
        // Status badge
        const statusBadge = item.status === 'available' ? 
          '<span class="badge green small">Available</span>' : 
          '<span class="badge red small">Out of Stock</span>';
        
        row.innerHTML = `
          <td>${item.name}</td>
          <td>${item.description || '-'}</td>
          <td>${item.category ? item.category.name || item.category : '-'}</td>
          <td>${formattedPrice}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="icon-button edit-menu-btn" data-id="${item._id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="icon-button delete-menu-btn" data-id="${item._id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        
        menuTableBody.appendChild(row);
      });
      
      // Setup edit and delete buttons
      setupMenuButtons();
    })
    .catch(error => {
      console.error("Error fetching menu items:", error);
      menuTableBody.innerHTML = '<tr><td colspan="6">Error loading menu data. Please try again.</td></tr>';
    });
}
// Setup menu action buttons
function setupMenuButtons() {
  // Edit menu buttons
  const editButtons = document.querySelectorAll('.edit-menu-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.getAttribute('data-id');
      openMenuItemModal(itemId);
    });
  });
  
  // Delete menu buttons
  const deleteButtons = document.querySelectorAll('.delete-menu-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this menu item?')) {
        deleteMenuItem(itemId);
      }
    });
  });
}

// Open menu item modal
function openMenuItemModal(itemId = null) {
  // Reset form
  document.getElementById('menu-item-form').reset();
  
  const modalTitle = document.getElementById('menu-item-modal-title');
  
  // Load categories for dropdown
  loadCategories();
  
  if (itemId) {
    // Edit mode
    modalTitle.textContent = 'Edit Menu Item';
    
    // Fetch menu item data from server
    fetch(`/api/menu/items/${itemId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(item => {
        // Fill form with menu item data
        document.getElementById('menu-item-name').value = item.name || '';
        
        // We're now using description instead of vietnameseName
        document.getElementById('menu-item-description').value = item.description || '';
        
        // Set category - wait for categories to load
        const categorySelect = document.getElementById('menu-item-category');
        const categoryInterval = setInterval(() => {
          if (categorySelect.options.length > 1) {
            clearInterval(categoryInterval);
            
            // Set category value - could be an ID or a string
            const categoryId = item.category._id || item.category;
            if (categorySelect.querySelector(`option[value="${categoryId}"]`)) {
              categorySelect.value = categoryId;
            } else {
              // If the exact category isn't found, try to find by name
              Array.from(categorySelect.options).forEach(option => {
                if (option.text.toLowerCase() === (item.category.name || '').toLowerCase()) {
                  categorySelect.value = option.value;
                }
              });
            }
          }
        }, 100);
        
        document.getElementById('menu-item-price').value = item.price || '';
        document.getElementById('menu-item-status').value = item.status || 'available';
        
        if (document.getElementById('menu-item-preparation-time')) {
          document.getElementById('menu-item-preparation-time').value = item.preparation_time || '';
        }
        
        // Store ID for later use
        document.getElementById('menu-item-form').setAttribute('data-id', itemId);
      })
      .catch(error => {
        console.error("Error loading menu item:", error);
        alert('Failed to load menu item data. Please try again.');
      });
  } else {
    // Add mode
    modalTitle.textContent = 'Add Menu Item';
    document.getElementById('menu-item-form').removeAttribute('data-id');
  }
  
  // Show modal
  showModal('menu-item-modal');
}

// Load categories for dropdown
function loadCategories() {
  const categorySelect = document.getElementById('menu-item-category');
  if (!categorySelect) return;
  
  // Clear existing options except for the first one
  while (categorySelect.options.length > 1) {
    categorySelect.remove(1);
  }
  
  // Fetch categories from server
  fetch('/api/menu/categories')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(categories => {
      // Add each category to the dropdown
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category._id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error("Error loading categories:", error);
      // Add some default categories as a fallback
      const defaultCategories = ['Soups', 'Appetizers', 'Main Courses', 'Desserts', 'Beverages'];
      defaultCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase().replace(/\s+/g, '-');
        option.textContent = category;
        categorySelect.appendChild(option);
      });
    });
}

// Save menu item data to MongoDB
function saveMenuItemData() {
  console.log("Save menu item button clicked");
  const form = document.getElementById('menu-item-form');
  
  // Basic validation
  if (!form.checkValidity()) {
    alert('Please fill all required fields.');
    return;
  }
  
  // Get form data
  const name = document.getElementById('menu-item-name').value;
  const vietnameseName = document.getElementById('menu-item-vietnamese').value;
  const categoryId = document.getElementById('menu-item-category').value;
  const price = parseFloat(document.getElementById('menu-item-price').value);
  const status = document.getElementById('menu-item-status').value;
  const description = document.getElementById('menu-item-description').value;
  
  // Get preparation time if available
  let preparation_time = null;
  if (document.getElementById('menu-item-preparation-time')) {
    preparation_time = parseInt(document.getElementById('menu-item-preparation-time').value) || 0;
  }
  
  // Prepare data for API call
  const menuItemData = {
    name,
    vietnameseName,
    category: categoryId,
    price,
    status,
    description
  };
  
  // Add preparation_time if available
  if (preparation_time !== null) {
    menuItemData.preparation_time = preparation_time;
  }
  
  const itemId = form.getAttribute('data-id');
  
  // API endpoint and method based on add/edit mode
  const url = itemId ? `/api/menu/items/${itemId}` : '/api/menu/items';
  const method = itemId ? 'PUT' : 'POST';
  
  console.log("Sending request to:", url);
  console.log("Request data:", menuItemData);
  
  // Make API call to save data
  fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(menuItemData)
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error('Network response was not ok: ' + text);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log("Success:", data);
      // Close modal and refresh list
      closeModal();
      displayMenuItems();
      
      // Update dashboard stats
      loadDashboardStats();
    })
    .catch(error => {
      console.error("Error saving menu item data:", error);
      alert('An error occurred while saving the menu item: ' + error.message);
    });
}

// Delete menu item from MongoDB
function deleteMenuItem(itemId) {
  // Make API call to delete menu item
  fetch(`/api/menu/items/${itemId}`, {
    method: 'DELETE'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Refresh list
      displayMenuItems();
      
      // Update dashboard stats
      loadDashboardStats();
    })
    .catch(error => {
      console.error("Error deleting menu item:", error);
      alert('An error occurred while deleting the menu item.');
    });
}
// ------------ USER MANAGEMENT ------------

// Initialize user management
function initUserManagement() {
  // Initial user data if none exists
  if (!localStorage.getItem('users')) {
    const initialUsers = [
      {
        id: 1,
        username: "admin",
        password: "admin123", // In a real app, this would be hashed
        name: "System Administrator",
        role: "admin",
        status: "active"
      },
      {
        id: 2,
        username: "manager",
        password: "manager123",
        name: "Le Van C",
        role: "manager",
        status: "active"
      },
      {
        id: 3,
        username: "staff1",
        password: "staff123",
        name: "Tran Thi B",
        role: "staff",
        status: "active"
      }
    ];
    localStorage.setItem('users', JSON.stringify(initialUsers));
  }
  
  // Add user button
  const addUserBtn = document.getElementById('add-user-btn');
  if (addUserBtn) {
    addUserBtn.addEventListener('click', function() {
      openUserModal();
    });
  }
  
  // Save user button
  const saveUserBtn = document.getElementById('save-user-btn');
  if (saveUserBtn) {
    saveUserBtn.addEventListener('click', function() {
      saveUserData();
    });
  }
}

// Display users
function displayUsers() {
  const userTableBody = document.getElementById('user-table-body');
  if (!userTableBody) return;
  
  // Clear the table
  userTableBody.innerHTML = '';
  
  try {
    // Get user data
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Add each user to the table
    users.forEach(user => {
      const row = document.createElement('tr');
      
      // Format role
      const formattedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
      
      // Status badge
      const statusBadge = user.status === 'active' ? 
        '<span class="badge green small">Active</span>' : 
        '<span class="badge red small">Inactive</span>';
      
      // Disable delete for admin
      const deleteDisabled = user.username === 'admin' ? 'disabled' : '';
      
      row.innerHTML = `
        <td>${user.username}</td>
        <td>${user.name}</td>
        <td>${formattedRole}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="icon-button edit-user-btn" data-id="${user.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="icon-button delete-user-btn" data-id="${user.id}" ${deleteDisabled}>
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      
      userTableBody.appendChild(row);
    });
    
    // Setup edit and delete buttons
    setupUserButtons();
  } catch (error) {
    console.error("Error displaying users:", error);
  }
}

// Setup user action buttons
function setupUserButtons() {
  // Edit user buttons
  const editButtons = document.querySelectorAll('.edit-user-btn');
  editButtons.forEach(button => {
    button.addEventListener('click', function() {
      const userId = this.getAttribute('data-id');
      openUserModal(userId);
    });
  });
  
  // Delete user buttons
  const deleteButtons = document.querySelectorAll('.delete-user-btn:not([disabled])');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
      const userId = this.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this user?')) {
        deleteUser(userId);
      }
    });
  });
}

// Open user modal
function openUserModal(userId = null) {
  // Reset form
  document.getElementById('user-form').reset();
  
  const modalTitle = document.getElementById('user-modal-title');
  const passwordField = document.getElementById('user-password');
  
  if (userId) {
    // Edit mode
    modalTitle.textContent = 'Edit User';
    
    // Password is optional for existing users
    passwordField.required = false;
    
    try {
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const user = users.find(u => u.id.toString() === userId.toString());
      
      if (user) {
        // Fill form with user data (except password)
        document.getElementById('username').value = user.username;
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-role').value = user.role;
        document.getElementById('user-status').value = user.status;
        
        // Don't fill password for security
        document.getElementById('user-password').value = '';
        
        // Store ID for later use
        document.getElementById('user-form').setAttribute('data-id', userId);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  } else {
    // Add mode
    modalTitle.textContent = 'Add User';
    passwordField.required = true;
    document.getElementById('user-form').removeAttribute('data-id');
  }
  
  // Show modal
  showModal('user-modal');
}

// Save user data
function saveUserData() {
  const form = document.getElementById('user-form');
  
  // Basic validation
  if (!form.checkValidity()) {
    alert('Please fill all required fields.');
    return;
  }
  
  // Get form data
  const username = document.getElementById('username').value;
  const password = document.getElementById('user-password').value;
  const name = document.getElementById('user-name').value;
  const role = document.getElementById('user-role').value;
  const status = document.getElementById('user-status').value;
  
  try {
    // Get current users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    const userId = form.getAttribute('data-id');
    
    if (userId) {
      // Update existing user
      const index = users.findIndex(u => u.id.toString() === userId.toString());
      if (index !== -1) {
        // Update all fields except password
        users[index] = {
          ...users[index],
          username,
          name,
          role,
          status
        };
        
        // Only update password if provided
        if (password) {
          users[index].password = password;
        }
      }
    } else {
      // Check if username already exists
      if (users.some(u => u.username === username)) {
        alert('Username already exists. Please choose a different one.');
        return;
      }
      
      // Add new user
      const newId = users.length > 0 ? 
        Math.max(...users.map(u => u.id)) + 1 : 1;
      
      users.push({
        id: newId,
        username,
        password,
        name,
        role,
        status
      });
    }
    
    // Save to localStorage
    localStorage.setItem('users', JSON.stringify(users));
    
    // Close modal and refresh list
    closeModal();
    displayUsers();
    
    // Update dashboard stats
    loadDashboardStats();
  } catch (error) {
    console.error("Error saving user data:", error);
    alert('An error occurred while saving the user.');
  }
}

// Delete user
function deleteUser(userId) {
  try {
    // Get current users
    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Remove user with the given ID
    users = users.filter(u => u.id.toString() !== userId.toString());
    
    // Save to localStorage
    localStorage.setItem('users', JSON.stringify(users));
    
    // Refresh list
    displayUsers();
    
    // Update dashboard stats
    loadDashboardStats();
  } catch (error) {
    console.error("Error deleting user:", error);
    alert('An error occurred while deleting the user.');
  }
}

// ------------ SETTINGS MANAGEMENT ------------

// Initialize settings management
function initSettingsManagement() {
  // Initial settings data if none exists
  if (!localStorage.getItem('restaurantSettings')) {
    const initialSettings = {
      restaurantName: "Viet Nam Cuisine",
      contactNumber: "(+84) 123 456 789",
      email: "info@vietnamcuisine.com",
      taxRate: 10,
      tableCount: 8,
      reservedTables: [5]
    };
    localStorage.setItem('restaurantSettings', JSON.stringify(initialSettings));
  }
  
  // Restaurant info form
  const restaurantInfoForm = document.getElementById('restaurant-info-form');
  if (restaurantInfoForm) {
    restaurantInfoForm.addEventListener('submit', function(event) {
      event.preventDefault();
      saveRestaurantInfo();
    });
  }
  
  // Table settings form
  const tableSettingsForm = document.getElementById('table-settings-form');
  if (tableSettingsForm) {
    tableSettingsForm.addEventListener('submit', function(event) {
      event.preventDefault();
      saveTableSettings();
    });
  }
}

// Load settings data into forms
function loadSettingsData() {
  try {
    const settings = JSON.parse(localStorage.getItem('restaurantSettings')) || {};
    
    // Restaurant info
    document.getElementById('restaurant-name').value = settings.restaurantName || '';
    document.getElementById('contact-number').value = settings.contactNumber || '';
    document.getElementById('restaurant-email').value = settings.email || '';
    document.getElementById('tax-rate').value = settings.taxRate || 10;
    
    // Table settings
    document.getElementById('table-count').value = settings.tableCount || 8;
    document.getElementById('reserved-tables').value = settings.reservedTables ? settings.reservedTables.join(',') : '';
  } catch (error) {
    console.error("Error loading settings data:", error);
  }
}

// Save restaurant info
function saveRestaurantInfo() {
  try {
    // Get current settings
    const settings = JSON.parse(localStorage.getItem('restaurantSettings')) || {};
    
    // Update with form values
    settings.restaurantName = document.getElementById('restaurant-name').value;
    settings.contactNumber = document.getElementById('contact-number').value;
    settings.email = document.getElementById('restaurant-email').value;
    settings.taxRate = parseInt(document.getElementById('tax-rate').value);
    
    // Save to localStorage
    localStorage.setItem('restaurantSettings', JSON.stringify(settings));
    
    // Update dashboard stats
    loadDashboardStats();
    
    alert('Restaurant information saved successfully!');
  } catch (error) {
    console.error("Error saving restaurant info:", error);
    alert('An error occurred while saving restaurant information.');
  }
}

// Save table settings
function saveTableSettings() {
  try {
    // Get current settings
    const settings = JSON.parse(localStorage.getItem('restaurantSettings')) || {};
    
    // Get form values
    const tableCount = parseInt(document.getElementById('table-count').value);
    
    // Parse reserved tables
    const reservedTablesStr = document.getElementById('reserved-tables').value;
    const reservedTables = reservedTablesStr
      .split(',')
      .map(table => parseInt(table.trim()))
      .filter(table => !isNaN(table));
    
    // Validate tables
    const invalidTables = reservedTables.filter(table => table < 1 || table > tableCount);
    if (invalidTables.length > 0) {
      alert(`Invalid table numbers: ${invalidTables.join(', ')}. Tables must be between 1 and ${tableCount}.`);
      return;
    }
    
    // Update settings
    settings.tableCount = tableCount;
    settings.reservedTables = reservedTables;
    
    // Save to localStorage
    localStorage.setItem('restaurantSettings', JSON.stringify(settings));
    
    // Update dashboard stats
    loadDashboardStats();
    
    alert('Table settings saved successfully!');
    
    // Notify other parts of the application
    window.dispatchEvent(new CustomEvent('tableSettingsChanged', {
      detail: { tableCount, reservedTables }
    }));
  } catch (error) {
    console.error("Error saving table settings:", error);
    alert('An error occurred while saving table settings.');
  }
}

// ------------ MODAL CONTROLS ------------

// Setup modal controls
function setupModalControls() {
  // Close buttons
  const closeButtons = document.querySelectorAll('.modal-close, .modal-cancel-btn');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      closeModal();
    });
  });
  
  // Close when clicking backdrop
  const modalBackdrop = document.getElementById('modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', function(event) {
      if (event.target === modalBackdrop) {
        closeModal();
      }
    });
  }
  
  // Close on Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
}

// Show a specific modal
function showModal(modalId) {
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modal = document.getElementById(modalId);
  
  if (modalBackdrop && modal) {
    // Hide all modals first
    document.querySelectorAll('.modal').forEach(m => {
      m.style.display = 'none';
    });
    
    // Show backdrop and specific modal
    modalBackdrop.style.display = 'flex';
    modal.style.display = 'block';
  }
}

// Close all modals
function closeModal() {
  const modalBackdrop = document.getElementById('modal-backdrop');
  
  if (modalBackdrop) {
    modalBackdrop.style.display = 'none';
    
    // Hide all modals
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
    });
  }
}

// ------------ HELPER FUNCTIONS ------------

// Format currency function
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}
