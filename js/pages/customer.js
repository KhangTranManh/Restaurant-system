// State variables
let cart = [];
let menuItems = [];
let menuCategories = [];
let activeCategory = 0;
let searchQuery = '';
let selectedTable = localStorage.getItem('selectedTable') || 1;
let isStaffMode = false;
let staffViewBtn = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Customer page loaded");
  
  // DOM Elements for Customer Page
  const menuSearch = document.getElementById('menu-search');
  const categoryNav = document.querySelector('.category-nav');
  const menuGrid = document.querySelector('.menu-grid');
  const menuTypeRadios = document.querySelectorAll('input[name="menu-type"]');
  const emptyCartMessage = document.getElementById('empty-cart-message');
  const cartItemsContainer = document.getElementById('cart-items');
  console.log("Cart container found:", cartItemsContainer);
  const placeOrderBtn = document.getElementById('place-order-btn');
  const cartTotal = document.getElementById('cart-total');
  const customerTableNumber = document.getElementById('customer-table-number');
  const customerOrders = document.getElementById('customer-orders');
  const customerOrderCards = document.getElementById('customer-order-cards');
  const noCustomerOrders = document.getElementById('no-customer-orders');
  const headerControls = document.querySelector('.header-controls');
  
  // Remove any stray badges that might appear in the search area
  const searchArea = document.querySelector('.search-bar').parentElement;
  if (searchArea) {
    const strayBadges = searchArea.querySelectorAll('.badge');
    strayBadges.forEach(badge => {
      if (!badge.closest('.menu-item')) {
        badge.remove();
      }
    });
  }

  // Verify essential elements are found
  if (!menuGrid || !categoryNav) {
    console.error("Essential customer page elements not found! DOM might not be ready.");
    return;
  } else {
    console.log("All essential customer page elements found");
  }
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('table')) {
    selectedTable = urlParams.get('table');
  }
  
  if (urlParams.has('staff')) {
    isStaffMode = urlParams.get('staff') === 'true';
  }
  
  // Check authentication
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  // If logged in as staff or admin, set staff mode and create staff view button
  if (currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin')) {
    isStaffMode = true;
    
    // Create Staff View button
    staffViewBtn = document.createElement('div');
    staffViewBtn.classList.add('nav-controls');
    staffViewBtn.innerHTML = `
      <button id="staff-view-btn" class="new-order-button">
        <i class="fas fa-utensils"></i> Staff View
      </button>
    `;
    
    // Add event listener to navigate to staff page
    const staffViewButton = staffViewBtn.querySelector('#staff-view-btn');
    staffViewButton.addEventListener('click', function() {
      window.location.href = 'staff.html';
    });
    
    // Append to header controls
    headerControls.appendChild(staffViewBtn);
  }
  
  
  // Initialize table selection
  initTableSelection();

  // Load menu categories from API
  loadMenuCategories();

  // Load initial menu items from API
  loadMenuItems();

  // Set up event listeners
  setupEventListeners();
  
  // Set table number
  if (customerTableNumber) {
    customerTableNumber.textContent = selectedTable;
  }
  
  // Load orders for the selected table
  loadOrders();
  
  // Set up logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      // Clear user data and local storage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('selectedTable');
      
      // Force redirect to login page with a clean slate
      window.location.replace('login.html');
    });
  }
  
  // Function definitions
  
  // Initialize table selection functionality
  function initTableSelection() {
    console.log("Initializing table selection");
    
    // Get the table selection buttons
    const tableButtons = document.querySelectorAll('.customer-tables-grid button');
    if (!tableButtons || tableButtons.length === 0) {
      console.error("Table selection buttons not found");
      return;
    }
    
    // Convert selectedTable to a number
    selectedTable = parseInt(selectedTable);
    
    // Update UI for initial state
    tableButtons.forEach(button => {
      const tableNumber = parseInt(button.getAttribute('data-table'));
      
      // Set active class for the initially selected table
      if (tableNumber === selectedTable) {
        button.classList.add('active');
      }
      
      // Add click event
      button.addEventListener('click', () => {
        // Update UI - remove active class from all buttons
        tableButtons.forEach(btn => {
          btn.classList.remove('active');
        });
        
        // Add active class to selected button
        button.classList.add('active');
        
        // Update selected table
        selectedTable = tableNumber;
        localStorage.setItem('selectedTable', selectedTable);
        
        // Update the displayed table number
        if (customerTableNumber) {
          customerTableNumber.textContent = selectedTable;
        }
        
        // Refresh orders for this table
        loadOrders();
      });
    });
  }

  // Load menu categories from API
  async function loadMenuCategories() {
    console.log("Loading menu categories from API");
    
    try {
      const response = await fetch('/api/menu/categories');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load menu categories');
      }
      
      menuCategories = data;
      renderMenuCategories();
      
    } catch (error) {
      console.error('Error loading menu categories:', error);
      // Fallback to empty categories
      menuCategories = [];
      renderMenuCategories();
    }
  }

  // Render menu categories
  function renderMenuCategories() {
    console.log("Rendering menu categories");
    // Check if categoryNav exists
    if (!categoryNav) {
      console.error("Category navigation element not found");
      return;
    }
    
    // Create "All" button if it doesn't exist
    let allButton = categoryNav.querySelector('button[data-category="0"]');
    if (!allButton) {
      allButton = document.createElement('button');
      allButton.className = activeCategory === 0 ? 'primary' : 'secondary';
      allButton.dataset.category = "0";
      allButton.textContent = "All";
      allButton.addEventListener('click', () => setActiveCategory(0));
    }
    
    // Clear existing categories
    categoryNav.innerHTML = '';
    categoryNav.appendChild(allButton);
    
    // Add category buttons
    menuCategories.forEach(category => {
      const btn = document.createElement('button');
      btn.className = category._id === activeCategory ? 'primary' : 'secondary';
      btn.dataset.category = category._id;
      btn.textContent = category.name;
      categoryNav.appendChild(btn);
      
      // Add event listener
      btn.addEventListener('click', () => setActiveCategory(category._id));
    });
  }

  // Set active category
  function setActiveCategory(categoryId) {
    console.log(`Setting active category to: ${categoryId}`);
    activeCategory = categoryId;
    
    // Update category buttons
    document.querySelectorAll('.category-nav button').forEach(btn => {
      const btnCategoryId = btn.dataset.category;
      btn.className = btnCategoryId === activeCategory ? 'primary' : 'secondary';
    });
    
    // Reload menu items with the selected category
    loadMenuItems();
  }

  // Load menu items from API
  async function loadMenuItems() {
    console.log("Loading menu items from API");
    
    try {
      // Build the URL with query parameters
      let url = '/api/menu/items';
      
      const queryParams = [];
      
      // Add category filter if not "All"
      if (activeCategory !== 0) {
        queryParams.push(`category_id=${activeCategory}`);
      }
      
      // Add search filter if present
      if (searchQuery) {
        queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
      }
      
      // Add menu type if available
      const checkedRadio = document.querySelector('input[name="menu-type"]:checked');
      if (checkedRadio) {
        const menuType = checkedRadio.value;
        queryParams.push(`menu_type=${menuType}`);
      }
      
      // Append query parameters to URL
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      // Fetch the menu items
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load menu items');
      }
      
      menuItems = data;
      renderMenuItems();
      
    } catch (error) {
      console.error('Error loading menu items:', error);
      // Fallback to empty items
      menuItems = [];
      renderMenuItems();
    }
  }

  // Render menu items
  function renderMenuItems() {
    console.log("Rendering menu items");
    
    if (!menuGrid) {
      console.error("Menu grid element not found");
      return;
    }
    
    menuGrid.innerHTML = '';
    
    if (menuItems.length === 0) {
      menuGrid.innerHTML = '<div class="text-center">No menu items found</div>';
      return;
    }
    
    menuItems.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'card menu-item';
      menuItem.innerHTML = `
        <img src="${item.image_path || 'https://via.placeholder.com/250x150'}" alt="${item.name}">
        <span class="badge yellow">${formatCurrency(item.price)}</span>
        <div class="menu-item-details">
          <div class="menu-item-title">${item.name}</div>
          <div class="menu-item-description">${item.description}</div>
          <div class="menu-item-footer">
            <div class="prep-time">
              <i class="far fa-clock"></i> ${item.preparation_time} min
            </div>
            <button class="primary small add-to-cart" data-id="${item._id}">Add</button>
          </div>
        </div>
      `;
      
      menuGrid.appendChild(menuItem);
      
      // Add event listener for add to cart button
      const addBtn = menuItem.querySelector('.add-to-cart');
      if (addBtn) {
        addBtn.addEventListener('click', () => addToCart(item));
      }
    });
    
    console.log("Menu items rendered successfully");
  }

  // Add item to cart
  function addToCart(item) {
    console.log(`Adding item to cart: ${item.name}`);
    const existingItemIndex = cart.findIndex(cartItem => cartItem._id === item._id);
    
    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1, notes: '' });
    }
    
    renderCart();
  }

  // Remove item from cart
  function removeFromCart(itemId) {
    console.log(`Removing item from cart: ID ${itemId}`);
    const existingItemIndex = cart.findIndex(cartItem => cartItem._id === itemId);
    
    if (existingItemIndex >= 0) {
      if (cart[existingItemIndex].quantity > 1) {
        cart[existingItemIndex].quantity -= 1;
      } else {
        cart.splice(existingItemIndex, 1);
      }
      
      renderCart();
    }
  }

  // Update item notes in cart
  function updateItemNotes(itemId, notes) {
    const existingItemIndex = cart.findIndex(cartItem => cartItem._id === itemId);
    
    if (existingItemIndex >= 0) {
      cart[existingItemIndex].notes = notes;
    }
  }

  // Calculate total price of cart
  function calculateTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Render cart
  function renderCart() {
    console.log("Rendering cart");
    
    if (!emptyCartMessage || !cartItemsContainer || !placeOrderBtn || !cartTotal) {
      console.error("Some cart elements not found");
      return;
    }
    
    if (cart.length === 0) {
      emptyCartMessage.classList.remove('hidden');
      cartItemsContainer.classList.add('hidden');
      placeOrderBtn.disabled = true;
    } else {
      emptyCartMessage.classList.add('hidden');
      cartItemsContainer.classList.remove('hidden');
      placeOrderBtn.disabled = false;
      
      cartItemsContainer.innerHTML = '';
      
      cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
          <div class="cart-item-details">
            <div class="cart-item-header">
              <span class="cart-item-name">${item.name}</span>
              <span class="cart-item-price">${formatCurrency(item.price * item.quantity)}</span>
            </div>
            ${item.notes ? `<div class="cart-item-notes">${item.notes}</div>` : ''}
          </div>
          <div class="cart-item-quantity">
            <button class="decrease-quantity" data-id="${item._id}"><i class="fas fa-minus"></i></button>
            <span>${item.quantity}</span>
            <button class="increase-quantity" data-id="${item._id}"><i class="fas fa-plus"></i></button>
            <button class="remove-item" data-id="${item._id}"><i class="fas fa-trash"></i></button>
          </div>
        `;
        
        cartItemsContainer.appendChild(cartItem);
        
        // Add event listeners for quantity buttons
        cartItem.querySelector('.decrease-quantity').addEventListener('click', () => removeFromCart(item._id));
        cartItem.querySelector('.increase-quantity').addEventListener('click', () => addToCart(item));
        cartItem.querySelector('.remove-item').addEventListener('click', () => {
          cart = cart.filter(cartItem => cartItem._id !== item._id);
          renderCart();
        });
      });
    }
    
    // Update total
    cartTotal.textContent = formatCurrency(calculateTotal());
    console.log("Cart rendered successfully");
  }

  // Place order using API
  async function placeOrder() {
    console.log("Placing order");
    if (cart.length === 0) {
      alert("Your cart is empty. Please add items before placing an order.");
      return;
    }
    
    try {
      // Prepare order data for API
      const orderData = {
        tableId: selectedTable,
        items: cart.map(item => ({
          menuItemId: item._id,
          quantity: item.quantity,
          specialInstructions: item.notes || ''
        }))
      };
      
      // Get authentication token
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Send order to API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order');
      }
      
      // Clear cart
      cart = [];
      renderCart();
      
      // Refresh orders to show the new one
      loadOrders();
      
      // Show confirmation
      alert('Order placed successfully!');
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert('An error occurred while placing your order. Please try again.');
    }
  }
  
  // Load orders from API
  async function loadOrders() {
    console.log("Loading orders for table", selectedTable);
    
    try {
      const response = await fetch(`/api/orders/table/${selectedTable}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load orders');
      }
      
      // Render orders
      if (!customerOrders || !customerOrderCards || !noCustomerOrders) {
        console.error("Orders UI elements not found");
        return;
      }
      
      if (data.length === 0) {
        customerOrders.style.display = 'none';
        return;
      }
      
      customerOrders.style.display = 'block';
      noCustomerOrders.style.display = 'none';
      customerOrderCards.innerHTML = '';
      
      // Render each order
      data.forEach(order => {
        renderOrderCard(order);
      });
      
    } catch (error) {
      console.error('Error loading orders:', error);
      
      // Hide orders section on error
      if (customerOrders) {
        customerOrders.style.display = 'none';
      }
    }
  }

  // Render an order card
  function renderOrderCard(order) {
    console.log("Rendering order card for order", order._id);
    
    let statusBadgeClass = '';
    let statusText = '';
    
    switch(order.status) {
      case 'pending':
        statusBadgeClass = 'yellow';
        statusText = 'Pending';
        break;
      case 'preparing':
        statusBadgeClass = 'blue';
        statusText = 'Preparing';
        break;
      case 'ready':
        statusBadgeClass = 'green';
        statusText = 'Ready';
        break;
      case 'delivered':
        statusBadgeClass = 'gray';
        statusText = 'Delivered';
        break;
      default:
        statusBadgeClass = 'yellow';
        statusText = 'Pending';
    }
    
    const orderCard = document.createElement('div');
    orderCard.className = 'customer-order-card';
    orderCard.innerHTML = `
      <div class="customer-order-header">
        <div class="customer-order-title">
          Order #${order._id}
          <span class="badge ${statusBadgeClass}">${statusText}</span>
        </div>
        <div>${formatTime(order.created_at)}</div>
      </div>
      <div class="customer-order-items">
        ${order.items.map(item => `
          <div class="customer-order-item">
            <strong>${item.quantity}x</strong> ${item.menu_item_name}
            ${item.special_instructions ? ` - <em>${item.special_instructions}</em>` : ''}
          </div>
        `).join('')}
      </div>
      <div class="customer-order-status">
        <div>
          <strong>Total:</strong> ${formatCurrency(order.total_amount)}
        </div>
        <div>
          <strong>Status:</strong> ${getStatusText(order.status)}
        </div>
      </div>
    `;
    
    customerOrderCards.appendChild(orderCard);
  }

  // Get status text for display
  function getStatusText(status) {
    switch(status) {
      case 'pending':
        return 'Kitchen is preparing your order';
      case 'preparing':
        return 'Your food is being prepared';
      case 'ready':
        return 'Your order is ready for pickup';
      case 'delivered':
        return 'Your order has been delivered';
      default:
        return 'Processing your order';
    }
  }

  // Set up event listeners
  function setupEventListeners() {
    console.log("Setting up customer page event listeners");
    
    // Search functionality
    if (menuSearch) {
      menuSearch.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        loadMenuItems();
      });
    }
    
    // Menu type selection
    if (menuTypeRadios) {
      menuTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
          loadMenuItems();
        });
      });
    }
    
    // Place order button
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener('click', placeOrder);
    }
  }
});

// Setup for category and search listeners - these can be left empty as they're
// already handled in the main event listeners
function setupCategoryListeners() {
  console.log("Setting up category listeners");
}

function setupSearchListener() {
  console.log("Setting up search listener");
}

// Format currency in Vietnamese Dong
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

// Format time
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}