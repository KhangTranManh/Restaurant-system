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
  
  // Show the management view and hide other views
  function showManagementView() {
    // Get all admin panels
    const adminPanels = document.querySelectorAll('.admin-panel');
    adminPanels.forEach(panel => {
      panel.classList.add('hidden');
    });
    
    // Show management view
    const managementView = document.getElementById('admin-management-view');
    if (managementView) {
      managementView.classList.remove('hidden');
    }
    
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
  
  // Load the dashboard statistics
  function loadDashboardStats() {
    try {
      // Staff stats
      const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
      const totalStaff = staffData.length;
      const kitchenStaff = staffData.filter(s => s.role === 'chef' || s.role === 'bartender').length;
      
      // Update staff stats
      const staffStatsEls = document.querySelectorAll('#admin-management-view .card:nth-child(1) .stat-number');
      if (staffStatsEls && staffStatsEls.length >= 2) {
        staffStatsEls[0].textContent = totalStaff;
        staffStatsEls[1].textContent = kitchenStaff;
      }
      
      // Menu stats
      const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
      const totalItems = menuItems.length;
      
      // Get unique categories
      const categories = new Set();
      menuItems.forEach(item => {
        if (item.category) categories.add(item.category);
      });
      
      // Update menu stats
      const menuStatsEls = document.querySelectorAll('#admin-management-view .card:nth-child(2) .stat-number');
      if (menuStatsEls && menuStatsEls.length >= 2) {
        menuStatsEls[0].textContent = totalItems;
        menuStatsEls[1].textContent = categories.size;
      }
      
      // User stats
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const activeUsers = users.filter(u => u.status === 'active').length;
      const adminUsers = users.filter(u => u.role === 'admin').length;
      
      // Update user stats
      const userStatsEls = document.querySelectorAll('#admin-management-view .card:nth-child(3) .stat-number');
      if (userStatsEls && userStatsEls.length >= 2) {
        userStatsEls[0].textContent = activeUsers;
        userStatsEls[1].textContent = adminUsers;
      }
      
      // Settings stats
      const settings = JSON.parse(localStorage.getItem('restaurantSettings')) || { tableCount: 8, taxRate: 10 };
      
      // Update settings stats
      const settingsStatsEls = document.querySelectorAll('#admin-management-view .card:nth-child(4) .stat-number');
      if (settingsStatsEls && settingsStatsEls.length >= 2) {
        settingsStatsEls[0].textContent = settings.tableCount;
        settingsStatsEls[1].textContent = `${settings.taxRate}%`;
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  }
  
  // Set up management navigation
  function setupManagementNavigation() {
    // Staff management button
    const manageStaffBtn = document.getElementById('manage-staff-btn');
    if (manageStaffBtn) {
      manageStaffBtn.addEventListener('click', function() {
        displayStaffSection();
      });
    }
    
    // Menu management button
    const manageMenuBtn = document.getElementById('manage-menu-btn');
    if (manageMenuBtn) {
      manageMenuBtn.addEventListener('click', function() {
        displayMenuSection();
      });
    }
    
    // User management button
    const manageUsersBtn = document.getElementById('manage-users-btn');
    if (manageUsersBtn) {
      manageUsersBtn.addEventListener('click', function() {
        displayUserSection();
      });
    }
    
    // Settings management button
    const manageSettingsBtn = document.getElementById('manage-settings-btn');
    if (manageSettingsBtn) {
      manageSettingsBtn.addEventListener('click', function() {
        displaySettingsSection();
      });
    }
    
    // Back buttons
    setupBackButtons();
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
  
  // Display user management section
  function displayUserSection() {
    hideAllSections();
    
    const userSection = document.getElementById('user-management-section');
    if (userSection) {
      userSection.classList.remove('hidden');
      
      // Refresh user list
      displayUsers();
    }
  }
  
  // Display settings management section
  function displaySettingsSection() {
    hideAllSections();
    
    const settingsSection = document.getElementById('settings-management-section');
    if (settingsSection) {
      settingsSection.classList.remove('hidden');
      
      // Load settings into forms
      loadSettingsData();
    }
  }
  
  // Hide all management sections
  function hideAllSections() {
    const sections = document.querySelectorAll('.management-section');
    sections.forEach(section => {
      section.classList.add('hidden');
    });
  }
  
  // Setup back buttons for all management sections
  function setupBackButtons() {
    // All back buttons
    const backButtons = document.querySelectorAll('[id^="back-to-management"]');
    backButtons.forEach(button => {
      button.addEventListener('click', function() {
        hideAllSections();
        
        const managementView = document.getElementById('admin-management-view');
        if (managementView) {
          managementView.classList.remove('hidden');
          
          // Refresh dashboard stats
          loadDashboardStats();
        }
      });
    });
  }
  
  // ------------ STAFF MANAGEMENT ------------
  
  // Initialize staff management
  function initStaffManagement() {
    // Initial staff data if none exists
    if (!localStorage.getItem('staffData')) {
      const initialStaff = [
        {
          id: 1,
          name: "Nguyen Van A",
          role: "chef",
          contact: "0912345678",
          status: "active"
        },
        {
          id: 2,
          name: "Tran Thi B",
          role: "waiter",
          contact: "0923456789",
          status: "active"
        },
        {
          id: 3,
          name: "Le Van C",
          role: "manager",
          contact: "0934567890",
          status: "active"
        }
      ];
      localStorage.setItem('staffData', JSON.stringify(initialStaff));
    }
    
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
  }
  
  // Display staff list
  function displayStaffList() {
    const staffTableBody = document.getElementById('staff-table-body');
    if (!staffTableBody) return;
    
    // Clear the table
    staffTableBody.innerHTML = '';
    
    try {
      // Get staff data
      const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
      
      // Add each staff to the table
      staffData.forEach(staff => {
        const row = document.createElement('tr');
        
        // Format role with first letter capitalized
        const formattedRole = staff.role.charAt(0).toUpperCase() + staff.role.slice(1);
        
        // Status badge
        const statusBadge = staff.status === 'active' ? 
          '<span class="badge green small">Active</span>' : 
          '<span class="badge red small">Inactive</span>';
        
        row.innerHTML = `
          <td>${staff.name}</td>
          <td>${formattedRole}</td>
          <td>${staff.contact}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="icon-button edit-staff-btn" data-id="${staff.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="icon-button delete-staff-btn" data-id="${staff.id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        
        staffTableBody.appendChild(row);
      });
      
      // Setup edit and delete buttons
      setupStaffButtons();
    } catch (error) {
      console.error("Error displaying staff list:", error);
    }
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
    
    if (staffId) {
      // Edit mode
      modalTitle.textContent = 'Edit Staff';
      
      try {
        const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
        const staff = staffData.find(s => s.id.toString() === staffId.toString());
        
        if (staff) {
          // Fill form with staff data
          document.getElementById('staff-name').value = staff.name;
          document.getElementById('staff-role').value = staff.role;
          document.getElementById('staff-contact').value = staff.contact;
          document.getElementById('staff-status').value = staff.status;
          
          // Store ID for later use
          document.getElementById('staff-form').setAttribute('data-id', staffId);
        }
      } catch (error) {
        console.error("Error loading staff data:", error);
      }
    } else {
      // Add mode
      modalTitle.textContent = 'Add New Staff';
      document.getElementById('staff-form').removeAttribute('data-id');
    }
    
    // Show modal
    showModal('staff-modal');
  }
  
  // Save staff data
  function saveStaffData() {
    const form = document.getElementById('staff-form');
    
    // Basic validation
    if (!form.checkValidity()) {
      alert('Please fill all required fields.');
      return;
    }
    
    // Get form data
    const name = document.getElementById('staff-name').value;
    const role = document.getElementById('staff-role').value;
    const contact = document.getElementById('staff-contact').value;
    const status = document.getElementById('staff-status').value;
    
    try {
      // Get current staff data
      const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
      
      const staffId = form.getAttribute('data-id');
      
      if (staffId) {
        // Update existing staff
        const index = staffData.findIndex(s => s.id.toString() === staffId.toString());
        if (index !== -1) {
          staffData[index] = {
            ...staffData[index],
            name,
            role, 
            contact,
            status
          };
        }
      } else {
        // Add new staff
        const newId = staffData.length > 0 ? 
          Math.max(...staffData.map(s => s.id)) + 1 : 1;
        
        staffData.push({
          id: newId,
          name,
          role,
          contact,
          status
        });
      }
      
      // Save to localStorage
      localStorage.setItem('staffData', JSON.stringify(staffData));
      
      // Close modal and refresh list
      closeModal();
      displayUsers();
      
      // Update dashboard stats
      loadDashboardStats();
    } catch (error) {
      console.error("Error saving user:", error);
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
  
  // Save staff data
  function saveStaffData() {
    const form = document.getElementById('staff-form');
    
    // Basic validation
    if (!form.checkValidity()) {
      alert('Please fill all required fields.');
      return;
    }
    
    // Get form data
    const name = document.getElementById('staff-name').value;
    const role = document.getElementById('staff-role').value;
    const contact = document.getElementById('staff-contact').value;
    const status = document.getElementById('staff-status').value;
    
    try {
      // Get current staff data
      const staffData = JSON.parse(localStorage.getItem('staffData')) || [];
      
      const staffId = form.getAttribute('data-id');
      
      if (staffId) {
        // Update existing staff
        const index = staffData.findIndex(s => s.id.toString() === staffId.toString());
        if (index !== -1) {
          staffData[index] = {
            ...staffData[index],
            name,
            role, 
            contact,
            status
          };
        }
      } else {
        // Add new staff
        const newId = staffData.length > 0 ? 
          Math.max(...staffData.map(s => s.id)) + 1 : 1;
        
        staffData.push({
          id: newId,
          name,
          role,
          contact,
          status
        });
      }
      
      // Save to localStorage
      localStorage.setItem('staffData', JSON.stringify(staffData));
      
      // Close modal and refresh list
      closeModal();
      displayStaffList();
      
      // Update dashboard stats
      loadDashboardStats();
    } catch (error) {
      console.error("Error saving staff data:", error);
      alert('An error occurred while saving the staff data.');
    }
  }
  
  // Delete staff
  function deleteStaff(staffId) {
    try {
      // Get current staff data
      let staffData = JSON.parse(localStorage.getItem('staffData')) || [];
      
      // Remove staff with the given ID
      staffData = staffData.filter(s => s.id.toString() !== staffId.toString());
      
      // Save to localStorage
      localStorage.setItem('staffData', JSON.stringify(staffData));
      
      // Refresh list
      displayStaffList();
      
      // Update dashboard stats
      loadDashboardStats();
    } catch (error) {
      console.error("Error deleting staff:", error);
      alert('An error occurred while deleting the staff member.');
    }
  }
  
  // ------------ MENU MANAGEMENT ------------
  
  // Initialize menu management
  function initMenuManagement() {
    // Initial menu data if none exists
    if (!localStorage.getItem('menuItems')) {
      const initialMenu = [
        {
          id: 1,
          name: "Beef Pho",
          vietnameseName: "Phở Bò",
          category: "Soups",
          price: 75000,
          status: "available",
          description: "Traditional Vietnamese soup with beef, rice noodles and herbs."
        },
        {
          id: 2,
          name: "Fresh Spring Rolls",
          vietnameseName: "Gỏi Cuốn",
          category: "Appetizers",
          price: 65000,
          status: "available",
          description: "Rice paper rolls with shrimp, pork, vermicelli and vegetables."
        },
        {
          id: 3,
          name: "Vietnamese Coffee",
          vietnameseName: "Cà Phê Sữa Đá",
          category: "Beverages",
          price: 35000,
          status: "available",
          description: "Strong coffee served with sweetened condensed milk."
        }
      ];
      localStorage.setItem('menuItems', JSON.stringify(initialMenu));
    }
    
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
  }
  
  // Display menu items
  function displayMenuItems() {
    const menuTableBody = document.getElementById('menu-table-body');
    if (!menuTableBody) return;
    
    // Clear the table
    menuTableBody.innerHTML = '';
    
    try {
      // Get menu data
      const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
      
      // Add each item to the table
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
          <td>${item.vietnameseName}</td>
          <td>${item.category}</td>
          <td>${formattedPrice}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="icon-button edit-menu-btn" data-id="${item.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="icon-button delete-menu-btn" data-id="${item.id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        
        menuTableBody.appendChild(row);
      });
      
      // Setup edit and delete buttons
      setupMenuButtons();
    } catch (error) {
      console.error("Error displaying menu items:", error);
    }
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
    
    if (itemId) {
      // Edit mode
      modalTitle.textContent = 'Edit Menu Item';
      
      try {
        const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
        const item = menuItems.find(i => i.id.toString() === itemId.toString());
        
        if (item) {
          // Fill form with menu item data
          document.getElementById('menu-item-name').value = item.name;
          document.getElementById('menu-item-vietnamese').value = item.vietnameseName;
          document.getElementById('menu-item-category').value = item.category.toLowerCase().replace(/\s+/g, '-');
          document.getElementById('menu-item-price').value = item.price;
          document.getElementById('menu-item-status').value = item.status;
          document.getElementById('menu-item-description').value = item.description || '';
          
          // Store ID for later use
          document.getElementById('menu-item-form').setAttribute('data-id', itemId);
        }
      } catch (error) {
        console.error("Error loading menu item:", error);
      }
    } else {
      // Add mode
      modalTitle.textContent = 'Add Menu Item';
      document.getElementById('menu-item-form').removeAttribute('data-id');
    }
    
    // Show modal
    showModal('menu-item-modal');
  }
  
  // Save menu item data
  function saveMenuItemData() {
    const form = document.getElementById('menu-item-form');
    
    // Basic validation
    if (!form.checkValidity()) {
      alert('Please fill all required fields.');
      return;
    }
    
    // Get form data
    const name = document.getElementById('menu-item-name').value;
    const vietnameseName = document.getElementById('menu-item-vietnamese').value;
    const category = document.getElementById('menu-item-category').value;
    const price = parseInt(document.getElementById('menu-item-price').value);
    const status = document.getElementById('menu-item-status').value;
    const description = document.getElementById('menu-item-description').value;
    
    // Format category
    const formattedCategory = category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    try {
      // Get current menu items
      const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
      
      const itemId = form.getAttribute('data-id');
      
      if (itemId) {
        // Update existing item
        const index = menuItems.findIndex(i => i.id.toString() === itemId.toString());
        if (index !== -1) {
          menuItems[index] = {
            ...menuItems[index],
            name,
            vietnameseName,
            category: formattedCategory,
            price,
            status,
            description
          };
        }
      } else {
        // Add new item
        const newId = menuItems.length > 0 ? 
          Math.max(...menuItems.map(i => i.id)) + 1 : 1;
        
        menuItems.push({
          id: newId,
          name,
          vietnameseName,
          category: formattedCategory,
          price,
          status,
          description
        });
      }
      
      // Save to localStorage
      localStorage.setItem('menuItems', JSON.stringify(menuItems));
      
      // Close modal and refresh list
      closeModal();
      displayMenuItems();
      
      // Update dashboard stats
      loadDashboardStats();
    } catch (error) {
      console.error("Error saving menu item:", error);
      alert('An error occurred while saving the menu item.');
    }
  }
  
  // Delete menu item
  function deleteMenuItem(itemId) {
    try {
      // Get current menu items
      let menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
      
      // Remove item with the given ID
      menuItems = menuItems.filter(i => i.id.toString() !== itemId.toString());
      
      // Save to localStorage
      localStorage.setItem('menuItems', JSON.stringify(menuItems));
      
      // Refresh list
      displayMenuItems();
      
      // Update dashboard stats
      loadDashboardStats();
    } catch (error) {
      console.error("Error deleting menu item:", error);
      alert('An error occurred while deleting the menu item.');
    }
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