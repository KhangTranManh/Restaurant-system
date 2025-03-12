// State variables
let cart = [];
let menuItems = [];
let menuCategories = [];
let activeCategory = 0;
let searchQuery = '';
let selectedTable = localStorage.getItem('selectedTable') || 1;
let isStaffMode = false;
let staffViewBtn = null;

// Sample menu categories data
const sampleMenuCategories = [
  { category_id: 1, name: 'Noodles', description: 'Hearty Vietnamese soups' },
  { category_id: 2, name: 'Rice', description: 'Traditional rice dishes' },
  { category_id: 3, name: 'Desserts', description: 'Sweet treats to finish your meal' },
  { category_id: 4, name: 'Additional foods', description: 'Extra dishes to complement your meal ' },
  { category_id: 5, name: 'Drinks', description: 'Refreshing beverages' }
];

// Sample menu items data
const sampleMenuItems = [
  // Soups (category_id: 1)
  { item_id: 101, category_id: 1, name: 'Phở', price: 60000, image_path: '/images/Pho.jpg', description: 'Traditional beef noodle soup with herbs and bean sprouts', preparation_time: 18 },
  { item_id: 102, category_id: 1, name: 'Bún Bò Huế', price: 60000, image_path: '/images/bun-bo-hue.jpg', description: 'Spicy beef noodle soup from central Vietnam', preparation_time: 15 },
  { item_id: 103, category_id: 1, name: 'Bún Chả', price: 45000, image_path: '/images/bun-cha.jpg', description: 'Grilled pork with rice noodles and herbs', preparation_time: 10 },

  // Rice & Noodles (category_id: 2)
  { item_id: 201, category_id: 2, name: 'Cơm Chiên Hải Sản', price: 60000, image_path: '/images/com-chien.jpg', description: 'Seafood fried rice', preparation_time: 20 },
  { item_id: 202, category_id: 2, name: 'Cơm Tấm', price: 60000, image_path: '/images/com-tam.jpg', description: 'Broken rice with grilled pork, egg, and vegetables', preparation_time: 15 },
    
  // Desserts (category_id: 3)
  { item_id: 301, category_id: 3, name: 'Chè Ba Màu', price: 20000, image_path: '/images/che-ba-mau.jpg', description: 'Three-color dessert with beans, jelly, and coconut milk', preparation_time: 8 },
  { item_id: 302, category_id: 3, name: 'Bánh Flan', price: 18000, image_path: '/images/banh-flan.jpg', description: 'Vietnamese caramel custard', preparation_time: 5 },
  { item_id: 303, category_id: 3, name: 'Chè Đậu Xanh', price: 25000, image_path: '/images/che-dau-xanh.jpg', description: 'Mung bean pudding with coconut cream', preparation_time: 6 },
  
  // Addtional Foods (category_id: 4)
  { item_id: 401, category_id: 4, name: 'Bánh Xèo', price: 30000, image_path: '/images/banh-xeo.jpg', description: 'Vietnamese crispy pancake with shrimp and bean sprouts', preparation_time: 15 },
  { item_id: 402, category_id: 4, name: 'Chả giò', price: 25000, image_path: '/images/spring-rolls.jpg', description: 'Vietnamese crispy pancake with shrimp and bean sprouts', preparation_time: 15 },


  // Drinks (category_id: 5)
  { item_id: 501, category_id: 5, name: 'Cà Phê Sữa Đá', price: 15000, image_path: '/images/ca-phe-sua-da.jpg', description: 'Vietnamese iced coffee with condensed milk', preparation_time: 5 },
  { item_id: 502, category_id: 5, name: 'Trà Lipton', price: 10000, image_path: '/images/iced-tea.jpg', description: 'Salted preserved lime juice', preparation_time: 3 },
  { item_id: 503, category_id: 5, name: 'Sinh Tố Bơ', price: 25000, image_path: '/images/sinh-to-bo.jpg', description: 'Avocado smoothie with condensed milk', preparation_time: 8 }
];
// Sample orders data
let sampleOrders = [];

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
const strayBadges = searchArea.querySelectorAll('.badge');
strayBadges.forEach(badge => {
  if (!badge.closest('.menu-item')) {
    badge.remove();
  }
});

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

  // Load menu categories and set up initial state
  menuCategories = sampleMenuCategories;
  renderMenuCategories();

  // Load initial menu items
  menuItems = sampleMenuItems;
  renderMenuItems();

  // Set up event listeners
  setupEventListeners();
  setupCategoryListeners();
  setupSearchListener();
  
  // Set table number
  if (customerTableNumber) {
    customerTableNumber.textContent = selectedTable;
  }
  
  // Set up logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      // Clear user data and local storage
      localStorage.removeItem('currentUser');
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

  // Load menu categories
  function loadMenuCategories() {
    console.log("Loading menu categories");
    
    // In a real app, fetch categories from the server
    // For now, use sample data
    menuCategories = sampleMenuCategories;
    renderMenuCategories();
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
      btn.className = category.category_id === activeCategory ? 'primary' : 'secondary';
      btn.dataset.category = category.category_id;
      btn.textContent = category.name;
      categoryNav.appendChild(btn);
      
      // Add event listener
      btn.addEventListener('click', () => setActiveCategory(category.category_id));
    });
  }

  // Set active category
  function setActiveCategory(categoryId) {
    console.log(`Setting active category to: ${categoryId}`);
    activeCategory = parseInt(categoryId);
    
    // Update category buttons
    document.querySelectorAll('.category-nav button').forEach(btn => {
      const btnCategoryId = parseInt(btn.dataset.category);
      btn.className = btnCategoryId === activeCategory ? 'primary' : 'secondary';
    });
    
    // Filter menu items
    loadMenuItems();
  }

  // Load menu items
  function loadMenuItems() {
    console.log("Loading menu items");
    
    // Get the menu type if available
    let menuType = 'a-la-carte'; // Default value
    const checkedRadio = document.querySelector('input[name="menu-type"]:checked');
    if (checkedRadio) {
      menuType = checkedRadio.value;
    }
    
    console.log(`Menu type: ${menuType}`);
    
    // In a real app, fetch menu items from the server
    // For now, use sample data and filter it
    menuItems = sampleMenuItems.filter(item => {
      // Filter by category if needed
      if (activeCategory !== 0 && item.category_id !== activeCategory) {
        return false;
      }
      
      // Filter by search query if needed
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    console.log(`Filtered menu items: ${menuItems.length} items`);
    renderMenuItems();
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
        <span class="badge yellow">${(item.price).toLocaleString('vi-VN')} ₫</span>
        <div class="menu-item-details">
          <div class="menu-item-title">${item.name}</div>
          <div class="menu-item-description">${item.description}</div>
          <div class="menu-item-footer">
            <div class="prep-time">
              <i class="far fa-clock"></i> ${item.preparation_time} min
            </div>
            <button class="primary small add-to-cart" data-id="${item.item_id}">Add</button>
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
    const existingItemIndex = cart.findIndex(cartItem => cartItem.item_id === item.item_id);
    
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
    const existingItemIndex = cart.findIndex(cartItem => cartItem.item_id === itemId);
    
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
    const existingItemIndex = cart.findIndex(cartItem => cartItem.item_id === itemId);
    
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
          <button class="decrease-quantity" data-id="${item.item_id}"><i class="fas fa-minus"></i></button>
          <span>${item.quantity}</span>
          <button class="increase-quantity" data-id="${item.item_id}"><i class="fas fa-plus"></i></button>
          <button class="remove-item" data-id="${item.item_id}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      
      cartItemsContainer.appendChild(cartItem);
      
      // Add event listeners for quantity buttons
      cartItem.querySelector('.decrease-quantity').addEventListener('click', () => removeFromCart(item.item_id));
      cartItem.querySelector('.increase-quantity').addEventListener('click', () => addToCart(item));
      cartItem.querySelector('.remove-item').addEventListener('click', () => {
        cart = cart.filter(cartItem => cartItem.item_id !== item.item_id);
        renderCart();
      });
    });
  }
  
  // Update total
  cartTotal.textContent = formatCurrency(calculateTotal());
  console.log("Cart rendered successfully");
}

  // Place order
  function placeOrder() {
    console.log("Placing order");
    if (cart.length === 0) {
      alert("Your cart is empty. Please add items before placing an order.");
      return;
    }
    
    // Create order data
  const orderData = {
    order_id: Math.floor(1000 + Math.random() * 9000),
    table_number: selectedTable,
    table_id: selectedTable,
    status: 'pending',
    created_at: new Date().toISOString(),
    items: cart.map(item => ({
      order_item_id: Math.floor(Math.random() * 1000),
      menu_item_id: item.item_id,
      menu_item_name: item.name,
      quantity: item.quantity,
      item_price: item.price,
      special_instructions: item.notes || ''
    })),
    total_amount: calculateTotal()
  };
  
  console.log("Order created:", orderData);
  
  // Add to local storage for staff view
  localStorage.setItem('newOrderForStaff', JSON.stringify(orderData));
  
  // Trigger storage event manually (for same-page communication)
  window.dispatchEvent(new Event('storage'));
  
  // Add to sample orders
  sampleOrders.push(orderData);
  
  // Clear cart
  cart = [];
  renderCart();
  
  // Refresh orders
  loadOrders();
  
  // Show confirmation
  alert('Order placed successfully!');
}
  
  // Listen for new orders from other views
  
window.addEventListener('storage', function(event) {
  if (event.key === 'newStaffOrder') {
    const newOrder = JSON.parse(event.newValue);
    console.log("Received new order notification", newOrder);
    
    // Add to sample orders if it's not already there
    const existingOrder = sampleOrders.find(o => o.order_id === newOrder.order_id);
    if (!existingOrder) {
      sampleOrders.push(newOrder);
      loadOrders();
    }
  }
});

  // Enhanced order loading
function loadOrders() {
  console.log("Loading orders for table", selectedTable);
  
  // Check for new orders in local storage
  const newOrderStr = localStorage.getItem('newOrderForStaff');
  if (newOrderStr) {
    try {
      const newOrder = JSON.parse(newOrderStr);
      // Add to sample orders only if it's not already there
      const existingOrder = sampleOrders.find(o => o.order_id === newOrder.order_id);
      if (!existingOrder) {
        sampleOrders.push(newOrder);
      }
    } catch (error) {
      console.error("Error parsing new order:", error);
    }
  }
  
 // Filter orders for this table
 const tableOrders = sampleOrders.filter(order => order.table_number == selectedTable);
 console.log(`Found ${tableOrders.length} orders for table ${selectedTable}`);
 
 // Render orders
 if (!customerOrders || !customerOrderCards || !noCustomerOrders) {
   console.error("Orders UI elements not found");
   return;
 }
 
 if (tableOrders.length === 0) {
   customerOrders.style.display = 'none';
   return;
 }
 
 customerOrders.style.display = 'block';
 noCustomerOrders.style.display = 'none';
 customerOrderCards.innerHTML = '';
 
 // Use a Set to track unique order IDs
 const uniqueOrderIds = new Set();
 
 tableOrders.forEach(order => {
  if (!uniqueOrderIds.has(order.order_id)) {
    renderOrderCard(order);
    uniqueOrderIds.add(order.order_id);
  }
});
}

  // Render an order card
  function renderOrderCard(order) {
    console.log("Rendering order card for order", order.order_id);
    
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
          Order #${order.order_id}
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

// Set up category listeners
function setupCategoryListeners() {
  // This function is called but not defined
  console.log("Setting up category listeners");
  // You can implement this if needed
}

// Set up search listener
function setupSearchListener() {
  // This function is called but not defined
  console.log("Setting up search listener");
  // You can implement this if needed
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