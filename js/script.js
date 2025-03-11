// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let socket;

// State variables
let currentUserRole = 'customer';
let selectedTable = 1;
let activeCategory = 0;
let searchQuery = '';
let cart = [];
let orders = [];
let menuItems = [];
let menuCategories = [];

// =====================
// API Helper Functions
// =====================
async function fetchAPI(endpoint, options = {}) {
  // Add authorization header if token exists
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }

  // Default headers
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    // Handle unauthenticated responses
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      token = null;
      currentUser = null;
      showLoginView();
      throw new Error('Authentication required');
    }
    
    // Check for other errors
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Connect to WebSocket
function connectSocket() {
  if (!currentUser) return;
  
  // Close existing connection if any
  if (socket) {
    socket.disconnect();
  }
  
  // Connect to WebSocket server
  socket = io(API_BASE_URL.replace('/api', ''));
  
  // Join appropriate room based on user role
  socket.emit('join', { role: currentUser.role });
  
  // Listen for events
  socket.on('newOrder', handleNewOrder);
  socket.on('orderStatusChanged', handleOrderStatusChange);
  
  console.log('WebSocket connected');
}


// =====================
// Event Handlers
// =====================
function handleNewOrder(order) {
  // Only update if we're in staff or kitchen view
  if (currentUserRole === 'staff' || currentUserRole === 'kitchen') {
    orders.unshift(order);
    
    if (currentUserRole === 'staff') {
      renderStaffOrders();
    } else if (currentUserRole === 'kitchen') {
      renderKitchenOrders();
    }
  }
}

function handleOrderStatusChange(orderUpdate) {
  // Find and update the order
  const orderIndex = orders.findIndex(o => o.order_id === orderUpdate.orderId);
  if (orderIndex >= 0) {
    orders[orderIndex].status = orderUpdate.status;
    
    // Update UI based on role
    if (currentUserRole === 'customer') {
      renderCustomerOrders();
    } else if (currentUserRole === 'staff') {
      renderStaffOrders();
    } else if (currentUserRole === 'kitchen') {
      renderKitchenOrders();
    }
  }
}

// =====================
// Authentication Functions
// =====================
async function login(username, password) {
  try {
    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    // Store authentication data
    token = data.token;
    currentUser = {
      userId: data.userId,
      username: data.username,
      role: data.role
    };
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    // Connect WebSocket
    connectSocket();
    
    // Set user role in UI
    setUserRole(currentUser.role);
    
    // Update user info
    updateUserInfo();
    
    // Hide login view
    document.getElementById('login-view').classList.add('hidden');
    
    // Fetch initial data
    fetchMenuItems();
    fetchOrders();
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    alert('Login failed: ' + error.message);
    return false;
  }
}

function logout() {
  // Clear authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  token = null;
  currentUser = null;
  
  // Disconnect WebSocket
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  
  // Update user info
  updateUserInfo();
  
  // Show login view if not customer
  setUserRole('customer');
}

function updateUserInfo() {
  const userInfoElement = document.getElementById('user-info');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (currentUser) {
    userInfoElement.textContent = `${currentUser.username} (${currentUser.role})`;
    logoutBtn.classList.remove('hidden');
  } else {
    userInfoElement.textContent = '';
    logoutBtn.classList.add('hidden');
  }
}

// =====================
// Data Fetching Functions
// =====================
async function fetchMenuItems() {
  try {
    let url = '/menu/items';
    
    // Add query parameters
    const params = new URLSearchParams();
    
    if (activeCategory !== 0) {
      params.append('category_id', activeCategory);
    }
    
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    
    if (currentUserRole === 'customer') {
      // Get the menu type (à-la-carte or buffet)
      const menuType = document.querySelector('input[name="menu-type"]:checked')?.value || 'a-la-carte';
      params.append('menu_type', menuType);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    // For demo purposes, we'll use hardcoded data for now
    // In a real implementation, you would use:
    // menuItems = await fetchAPI(url);
    
    // Mock data for demo
    menuItems = [
      { item_id: 101, category_id: 1, name: 'Spring Rolls', price: 8.50, image_path: 'images/spring-rolls.jpg', description: 'Fresh vegetables and shrimp wrapped in rice paper', preparation_time: 10 },
      { item_id: 102, category_id: 1, name: 'Crispy Wontons', price: 7.50, image_path: 'images/wontons.jpg', description: 'Fried wontons with sweet dipping sauce', preparation_time: 8 },
      { item_id: 103, category_id: 1, name: 'Edamame', price: 6.00, image_path: 'images/edamame.jpg', description: 'Steamed soybeans with salt', preparation_time: 5 },
      { item_id: 201, category_id: 2, name: 'Grilled Salmon', price: 22.50, image_path: 'images/salmon.jpg', description: 'Fresh salmon with lemon butter sauce', preparation_time: 18 },
      { item_id: 202, category_id: 2, name: 'Beef Stir Fry', price: 19.50, image_path: 'images/beef-stir-fry.jpg', description: 'Tender beef with mixed vegetables', preparation_time: 15 },
      { item_id: 601, category_id: 5, name: 'Fresh Lemonade', price: 4.50, image_path: 'images/lemonade.jpg', description: 'Freshly squeezed lemonade', preparation_time: 3 },
    ].filter(item => {
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
    
    renderMenuItems();
  } catch (error) {
    console.error('Error fetching menu items:', error);
  }
}

async function fetchMenuCategories() {
  try {
    // Get the menu type (à-la-carte or buffet)
    const menuType = document.querySelector('input[name="menu-type"]:checked')?.value || 'a-la-carte';
    
    // For demo purposes, we'll use hardcoded data
    // In a real implementation, you would use:
    // const url = `/menu/categories?menu_type=${menuType}`;
    // menuCategories = await fetchAPI(url);
    
    // Mock data for demo
    menuCategories = [
      { category_id: 1, name: 'Appetizers', description: 'Start your meal with our delicious appetizers' },
      { category_id: 2, name: 'Main Courses', description: 'Hearty main dishes from our chef' },
      { category_id: 3, name: 'Desserts', description: 'Sweet treats to finish your meal' },
      { category_id: 5, name: 'Beverages', description: 'Drinks and refreshments' }
    ];
    
    // Update category nav
    const categoryNav = document.querySelector('.category-nav');
    categoryNav.innerHTML = '';
    
    // Add "All" button
    const allButton = document.createElement('button');
    allButton.className = activeCategory === 0 ? 'primary' : 'secondary';
    allButton.dataset.category = 0;
    allButton.textContent = 'All';
    categoryNav.appendChild(allButton);
    allButton.addEventListener('click', () => setActiveCategory(0));
    
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
  } catch (error) {
    console.error('Error fetching menu categories:', error);
  }
}

async function fetchOrders() {
  try {
    // For demo purposes, we'll use hardcoded data
    // In a real implementation, you would use:
    // let url = '/orders';
    // if (currentUserRole === 'customer') {
    //   url += `?table_id=${selectedTable}`;
    // }
    // orders = await fetchAPI(url);
    
    // Mock data for demo
    orders = [
      {
        order_id: 1001,
        table_id: 1,
        table_number: 1,
        status: 'pending',
        total_amount: 36.50,
        created_at: new Date().toISOString(),
        items: [
          { order_item_id: 1, menu_item_id: 101, menu_item_name: 'Spring Rolls', quantity: 2, item_price: 8.50, special_instructions: 'Extra sauce please' },
          { order_item_id: 2, menu_item_id: 201, menu_item_name: 'Grilled Salmon', quantity: 1, item_price: 22.50, special_instructions: '' }
        ]
      },
      {
        order_id: 1002,
        table_id: 2,
        table_number: 2,
        status: 'preparing',
        total_amount: 24.00,
        created_at: new Date(Date.now() - 10 * 60000).toISOString(),
        items: [
          { order_item_id: 3, menu_item_id: 102, menu_item_name: 'Crispy Wontons', quantity: 1, item_price: 7.50, special_instructions: '' },
          { order_item_id: 4, menu_item_id: 202, menu_item_name: 'Beef Stir Fry', quantity: 1, item_price: 19.50, special_instructions: 'Medium rare' }
        ]
      },
      {
        order_id: 1003,
        table_id: 3,
        table_number: 3,
        status: 'ready',
        total_amount: 31.50,
        created_at: new Date(Date.now() - 20 * 60000).toISOString(),
        items: [
          { order_item_id: 5, menu_item_id: 101, menu_item_name: 'Spring Rolls', quantity: 1, item_price: 8.50, special_instructions: '' },
          { order_item_id: 6, menu_item_id: 202, menu_item_name: 'Beef Stir Fry', quantity: 1, item_price: 19.50, special_instructions: '' },
          { order_item_id: 7, menu_item_id: 601, menu_item_name: 'Fresh Lemonade', quantity: 1, item_price: 4.50, special_instructions: 'No ice' }
        ]
      }
    ];
    
    // Filter orders for customer view
    if (currentUserRole === 'customer') {
      orders = orders.filter(order => order.table_id === selectedTable);
    }
    
    // Update UI based on role
    if (currentUserRole === 'customer') {
      renderCustomerOrders();
    } else if (currentUserRole === 'staff') {
      renderStaffOrders();
    } else if (currentUserRole === 'kitchen') {
      renderKitchenOrders();
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
}

async function fetchTables() {
  try {
    // For demo purposes, we'll use hardcoded data
    // In a real implementation, you would use:
    // const tables = await fetchAPI('/tables');
    
    // Mock data for demo
    const tables = [
      { table_id: 1, table_number: 1, status: 'available', capacity: 2 },
      { table_id: 2, table_number: 2, status: 'occupied', capacity: 2, current_order_id: 1002 },
      { table_id: 3, table_number: 3, status: 'occupied', capacity: 4, current_order_id: 1003 },
      { table_id: 4, table_number: 4, status: 'available', capacity: 4 },
      { table_id: 5, table_number: 5, status: 'reserved', capacity: 6 },
      { table_id: 6, table_number: 6, status: 'available', capacity: 6 },
      { table_id: 7, table_number: 7, status: 'available', capacity: 8 },
      { table_id: 8, table_number: 8, status: 'available', capacity: 8 }
    ];
    
    // Update tables grid
    const tablesGrid = document.querySelector('.tables-grid');
    tablesGrid.innerHTML = '';
    
    tables.forEach(table => {
      const btn = document.createElement('button');
      btn.className = table.table_id === selectedTable ? 'primary' : 'secondary';
      btn.classList.add(table.status);  // Add status class for styling
      btn.dataset.table = table.table_id;
      btn.dataset.number = table.table_number;
      btn.innerHTML = table.table_number;
      
      if (table.status === 'occupied') {
        btn.innerHTML += '<span class="table-indicator occupied"></span>';
      } else if (table.status === 'reserved') {
        btn.innerHTML += '<span class="table-indicator reserved"></span>';
      }
      
      tablesGrid.appendChild(btn);
      
      // Add event listener
      btn.addEventListener('click', () => setSelectedTable(table.table_id, table.table_number));
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
  }
}

// =====================
// Order Management Functions
// =====================
async function placeOrder() {
  if (cart.length === 0) return;
  
  try {
    const orderData = {
      tableId: selectedTable,
      userId: currentUser?.userId,
      orderType: document.querySelector('input[name="menu-type"]:checked')?.value || 'a-la-carte',
      items: cart.map(item => ({
        menuItemId: item.item_id,
        quantity: item.quantity,
        specialInstructions: item.notes || ''
      }))
    };
    
    // For demo purposes, we'll create a mock order
    // In a real implementation, you would use:
    // const newOrder = await fetchAPI('/orders', {
    //   method: 'POST',
    //   body: JSON.stringify(orderData)
    // });
    
    // Mock creating a new order
    const newOrder = {
      order_id: 1000 + orders.length + 1,
      table_id: selectedTable,
      table_number: selectedTable,
      status: 'pending',
      total_amount: calculateTotal(),
      created_at: new Date().toISOString(),
      items: cart.map((item, index) => ({
        order_item_id: 100 + index,
        menu_item_id: item.item_id,
        menu_item_name: item.name,
        quantity: item.quantity,
        item_price: item.price,
        special_instructions: item.notes || ''
      }))
    };
    
    // Add to local orders and clear cart
    orders.unshift(newOrder);
    cart = [];
    
    renderCart();
    renderCustomerOrders();
    
    alert('Order placed successfully!');
  } catch (error) {
    console.error('Error placing order:', error);
    alert('Failed to place order. Please try again.');
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    // For demo purposes, we'll update locally
    // In a real implementation, you would use:
    // await fetchAPI(`/orders/${orderId}/status`, {
    //   method: 'PUT',
    //   body: JSON.stringify({ status: newStatus })
    // });
    
    // Update local order
    const orderIndex = orders.findIndex(o => o.order_id === orderId);
    if (orderIndex >= 0) {
      orders[orderIndex].status = newStatus;
      
      // Simulate real-time update via socket
      handleOrderStatusChange({
        orderId: orderId,
        status: newStatus,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    alert('Failed to update order status. Please try again.');
  }
}

// =====================
// UI Helper Functions
// =====================
function showLoginView() {
  document.getElementById('login-view').classList.remove('hidden');
}

function hideLoginView() {
  document.getElementById('login-view').classList.add('hidden');
}

// Set active category
function setActiveCategory(categoryId) {
  activeCategory = parseInt(categoryId);
  
  // Update category buttons
  document.querySelectorAll('.category-nav button').forEach(btn => {
    const btnCategoryId = parseInt(btn.dataset.category);
    btn.className = btnCategoryId === activeCategory ? 'primary' : 'secondary';
  });
  
  // Fetch menu items with new category filter
  fetchMenuItems();
}

// Set selected table
function setSelectedTable(tableId, tableNumber) {
  selectedTable = parseInt(tableId);
  
  // Update table buttons
  document.querySelectorAll('.tables-grid button').forEach(btn => {
    const btnTable = parseInt(btn.dataset.table);
    btn.className = btnTable === selectedTable ? 'primary' : 'secondary';
    // Keep the status class
    if (btn.classList.contains('occupied')) btn.classList.add('occupied');
    if (btn.classList.contains('reserved')) btn.classList.add('reserved');
  });
  
  // Update table numbers
  document.getElementById('customer-table-number').textContent = tableNumber;
  document.getElementById('staff-table-number').textContent = tableNumber;
  
  // Show selected table card
  document.getElementById('selected-table').classList.remove('hidden');
  
  // Fetch orders for the selected table if in customer view
  if (currentUserRole === 'customer') {
    fetchOrders();
  }
}

// Role Selection
function setUserRole(role) {
  if (!currentUser && role !== 'customer') {
    // Show login for staff and kitchen roles
    showLoginView();
    return;
  }
  
  currentUserRole = role;
  
  // Update role buttons
  document.querySelectorAll('.role-buttons button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`${role}-btn`).classList.add('active');
  
  // Show appropriate view
  document.getElementById('customer-view').classList.add('hidden');
  document.getElementById('staff-view').classList.add('hidden');
  document.getElementById('kitchen-view').classList.add('hidden');
  document.getElementById(`${role}-view`).classList.remove('hidden');
  
  // Fetch appropriate data
  switch(role) {
    case 'customer':
      fetchMenuCategories();
      fetchMenuItems();
      fetchOrders();
      break;
    case 'staff':
      fetchTables();
      fetchOrders();
      break;
    case 'kitchen':
      fetchOrders();
      break;
  }
}

// =====================
// Rendering Functions
// =====================
function renderMenuItems() {
  const menuGrid = document.querySelector('.menu-grid');
  menuGrid.innerHTML = '';
  
  if (menuItems.length === 0) {
    menuGrid.innerHTML = '<div class="text-center">No menu items found</div>';
    return;
  }
  
  menuItems.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'card menu-item';
    menuItem.innerHTML = `
      <img src="${item.image_path || '/api/placeholder/250/150'}" alt="${item.name}">
      <span class="badge yellow">$${item.price.toFixed(2)}</span>
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
    menuItem.querySelector('.add-to-cart').addEventListener('click', () => addToCart(item));
  });
}

// Add item to cart
function addToCart(item) {
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
  const emptyCartMessage = document.getElementById('empty-cart-message');
  const cartItemsContainer = document.getElementById('cart-items');
  const placeOrderBtn = document.getElementById('place-order-btn');
  const cartTotal = document.getElementById('cart-total');
  
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
            <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
          </div>
          <div class="cart-item-notes">${item.notes ? item.notes : ''}</div>
          <input type="text" placeholder="Add notes (allergies, preferences)" class="item-notes" data-id="${item.item_id}" value="${item.notes || ''}">
        </div>
        <div class="cart-item-quantity">
          <button class="secondary small remove-item" data-id="${item.item_id}">
            <i class="fas fa-minus"></i>
          </button>
          <span>${item.quantity}</span>
          <button class="secondary small add-item" data-id="${item.item_id}">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      `;
      
      cartItemsContainer.appendChild(cartItem);
      
      // Add event listeners
      cartItem.querySelector('.remove-item').addEventListener('click', () => removeFromCart(item.item_id));
      cartItem.querySelector('.add-item').addEventListener('click', () => addToCart(item));
      cartItem.querySelector('.item-notes').addEventListener('input', (e) => updateItemNotes(item.item_id, e.target.value));
    });
  }
  
  // Update total
  cartTotal.textContent = `$${calculateTotal().toFixed(2)}`;
}

// Render customer orders
function renderCustomerOrders() {
  const customerOrders = document.getElementById('customer-orders');
  const customerOrderCards = document.getElementById('customer-order-cards');
  const noCustomerOrders = document.getElementById('no-customer-orders');
  
  if (orders.length === 0) {
    customerOrders.classList.add('hidden');
    return;
  }
  
  customerOrders.classList.remove('hidden');
  
  if (orders.some(order => order.table_id === selectedTable)) {
    noCustomerOrders.classList.add('hidden');
    customerOrderCards.classList.remove('hidden');
    
    customerOrderCards.innerHTML = '';
    
    orders.filter(order => order.table_id === selectedTable).forEach(order => {
      const orderCard = document.createElement('div');
      orderCard.className = 'order-card';
      
      let statusBadgeClass = '';
      switch(order.status) {
        case 'pending':
          statusBadgeClass = 'yellow';
          break;
        case 'preparing':
          statusBadgeClass = 'blue';
          break;
        case 'ready':
          statusBadgeClass = 'green';
          break;
        case 'delivered':
          statusBadgeClass = 'gray';
          break;
      }
      
      orderCard.innerHTML = `
        <div class="order-header">
          <span class="order-number">Order #${order.order_id}</span>
          <span class="badge ${statusBadgeClass}">
            ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
        <div class="order-items">
          ${order.items.map(item => `
            <div class="order-item">
              <span>${item.quantity}x ${item.menu_item_name}</span>
              <span>$${(item.item_price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div class="order-total">
          <span>Total:</span>
          <span>$${order.total_amount.toFixed(2)}</span>
        </div>
      `;
      
      customerOrderCards.appendChild(orderCard);
    });
  } else {
    noCustomerOrders.classList.remove('hidden');
    customerOrderCards.classList.add('hidden');
  }
}

// Render staff orders
function renderStaffOrders() {
  // Active orders
  const staffActiveOrders = document.getElementById('staff-active-orders');
  const noActiveOrders = document.getElementById('no-active-orders');
  
  const activeOrders = orders.filter(order => 
    (order.status === 'pending' || order.status === 'preparing')
  );
  
  if (activeOrders.length === 0) {
    staffActiveOrders.classList.add('hidden');
    noActiveOrders.classList.remove('hidden');
  } else {
    staffActiveOrders.classList.remove('hidden');
    noActiveOrders.classList.add('hidden');
    
    staffActiveOrders.innerHTML = '';
    
    activeOrders.forEach(order => {
      const orderCard = document.createElement('div');
      orderCard.className = 'staff-order-card';
      
      let statusBadgeClass = order.status === 'pending' ? 'yellow' : 'blue';
      
      orderCard.innerHTML = `
        <div class="staff-order-header">
          <div class="staff-order-title">
            <span>Order #${order.order_id} - Table ${order.table_number}</span>
            <span class="badge ${statusBadgeClass}">
              ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <div class="staff-order-time">${new Date(order.created_at).toLocaleTimeString()}</div>
        </div>
        <div class="staff-order-content">
          <div class="staff-order-items">
            ${order.items.map(item => `
              <div class="staff-order-item">
                <div class="staff-order-item-name">
                  <span class="staff-order-item-quantity">${item.quantity}x</span>
                  ${item.menu_item_name}
                  ${item.special_instructions ? `<span class="staff-order-item-notes">"${item.special_instructions}"</span>` : ''}
                </div>
                <span>$${(item.item_price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="staff-order-footer">
          <div class="staff-order-total">
            Total: $${order.total_amount.toFixed(2)}
          </div>
          <div class="staff-order-action">
            ${order.status === 'pending' ? `
              <button class="secondary" disabled>
                <i class="fas fa-spinner fa-spin"></i> Kitchen Preparing
              </button>
            ` : `
              <button class="secondary" disabled>
                <i class="far fa-clock"></i> Est. ${calculatePrepTime(order.items)} min
              </button>
            `}
          </div>
        </div>
      `;
      
      staffActiveOrders.appendChild(orderCard);
    });
  }
  
  // Ready orders
  const staffReadyOrders = document.getElementById('staff-ready-orders');
  const noReadyOrders = document.getElementById('no-ready-orders');
  
  const readyOrders = orders.filter(order => order.status === 'ready');
  
  if (readyOrders.length === 0) {
    staffReadyOrders.classList.add('hidden');
    noReadyOrders.classList.remove('hidden');
  } else {
    staffReadyOrders.classList.remove('hidden');
    noReadyOrders.classList.add('hidden');
    
    staffReadyOrders.innerHTML = '';
    
    readyOrders.forEach(order => {
      const orderCard = document.createElement('div');
      orderCard.className = 'staff-order-card';
      
      orderCard.innerHTML = `
        <div class="staff-order-header">
          <div class="staff-order-title">
            <span>Order #${order.order_id} - Table ${order.table_number}</span>
            <span class="badge green">Ready for Service</span>
          </div>
          <div class="staff-order-time">${new Date(order.created_at).toLocaleTimeString()}</div>
        </div>
        <div class="staff-order-content">
          <div class="staff-order-items">
            ${order.items.map(item => `
              <div class="staff-order-item">
                <div class="staff-order-item-name">
                  <span class="staff-order-item-quantity">${item.quantity}x</span>
                  ${item.menu_item_name}
                  ${item.special_instructions ? `<span class="staff-order-item-notes">"${item.special_instructions}"</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="staff-order-footer">
          <button class="primary mark-delivered" data-id="${order.order_id}">
            Mark as Delivered
          </button>
        </div>
      `;
      
      staffReadyOrders.appendChild(orderCard);
      
      // Add event listener
      orderCard.querySelector('.mark-delivered').addEventListener('click', () => {
        updateOrderStatus(order.order_id, 'delivered');
      });
    });
  }
  
  // Completed orders
  const staffCompletedOrders = document.getElementById('staff-completed-orders');
  const noCompletedOrders = document.getElementById('no-completed-orders');
  
  const completedOrders = orders.filter(order => order.status === 'delivered');
  
  if (completedOrders.length === 0) {
    staffCompletedOrders.classList.add('hidden');
    noCompletedOrders.classList.remove('hidden');
  } else {
    staffCompletedOrders.classList.remove('hidden');
    noCompletedOrders.classList.add('hidden');
    
    staffCompletedOrders.innerHTML = '';
    
    completedOrders.forEach(order => {
      const orderCard = document.createElement('div');
      orderCard.className = 'staff-order-card';
      
      orderCard.innerHTML = `
        <div class="staff-order-header">
          <div class="staff-order-title">
            <span>Order #${order.order_id} - Table ${order.table_number}</span>
            <span class="badge gray">Completed</span>
          </div>
          <div class="staff-order-time">${new Date(order.created_at).toLocaleTimeString()}</div>
        </div>
        <div class="staff-order-content">
          <div class="staff-order-items">
            ${order.items.map(item => `
              <div class="staff-order-item">
                <div class="staff-order-item-name">
                  ${item.quantity}x ${item.menu_item_name}
                </div>
                <span>$${(item.item_price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="staff-order-footer">
          <div class="staff-order-total">
            Total: $${order.total_amount.toFixed(2)}
          </div>
        </div>
      `;
      
      staffCompletedOrders.appendChild(orderCard);
    });
  }
}

// Render kitchen orders
function renderKitchenOrders() {
  // Pending orders
  const kitchenPendingOrders = document.getElementById('kitchen-pending-orders');
  const noPendingOrders = document.getElementById('no-pending-orders');
  
  const pendingOrders = orders.filter(order => order.status === 'pending');
  
  if (pendingOrders.length === 0) {
    kitchenPendingOrders.classList.add('hidden');
    noPendingOrders.classList.remove('hidden');
  } else {
    kitchenPendingOrders.classList.remove('hidden');
    noPendingOrders.classList.add('hidden');
    
    kitchenPendingOrders.innerHTML = '';
    
    pendingOrders.forEach(order => {
      const orderCard = document.createElement('div');
      orderCard.className = 'kitchen-order-card pending';
      
      orderCard.innerHTML = `
        <div class="kitchen-order-header pending">
          <div class="kitchen-order-title">
            <span>Order #${order.order_id}</span>
            <span class="badge yellow">New Order</span>
          </div>
          <div class="kitchen-order-subtitle">
            <span>Table ${order.table_number}</span>
            <span>${new Date(order.created_at).toLocaleTimeString()}</span>
          </div>
        </div>
        <div class="kitchen-order-content">
          <div class="kitchen-order-items">
            ${order.items.map(item => `
              <div class="kitchen-order-item">
                <div class="kitchen-order-item-name">${item.quantity}x ${item.menu_item_name}</div>
                ${item.special_instructions ? `<div class="kitchen-order-item-notes">Notes: ${item.special_instructions}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="kitchen-order-footer">
          <button class="primary start-preparation" data-id="${order.order_id}">
            Start Preparation
          </button>
        </div>
      `;
      
      kitchenPendingOrders.appendChild(orderCard);
      
      // Add event listener
      orderCard.querySelector('.start-preparation').addEventListener('click', () => {
        updateOrderStatus(order.order_id, 'preparing');
      });
    });
  }
  
  // Preparing orders
  const kitchenPreparingOrders = document.getElementById('kitchen-preparing-orders');
  const noPreparingOrders = document.getElementById('no-preparing-orders');
  
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  
  if (preparingOrders.length === 0) {
    kitchenPreparingOrders.classList.add('hidden');
    noPreparingOrders.classList.remove('hidden');
  } else {
    kitchenPreparingOrders.classList.remove('hidden');
    noPreparingOrders.classList.add('hidden');
    
    kitchenPreparingOrders.innerHTML = '';
    
    preparingOrders.forEach(order => {
      const orderCard = document.createElement('div');
      orderCard.className = 'kitchen-order-card preparing';
      
      orderCard.innerHTML = `
        <div class="kitchen-order-header preparing">
          <div class="kitchen-order-title">
            <span>Order #${order.order_id}</span>
            <span class="badge blue">In Preparation</span>
          </div>
          <div class="kitchen-order-subtitle">
            <span>Table ${order.table_number}</span>
            <span>${new Date(order.created_at).toLocaleTimeString()}</span>
          </div>
        </div>
        <div class="kitchen-order-content">
          <div class="kitchen-order-items">
            ${order.items.map(item => `
              <div class="kitchen-order-item">
                <div class="kitchen-order-item-name">${item.quantity}x ${item.menu_item_name}</div>
                ${item.special_instructions ? `<div class="kitchen-order-item-notes">Notes: ${item.special_instructions}</div>` : ''}
              </div>
            `).join('')}
          </div>
          <div class="kitchen-order-prep-time">
            <span class="font-medium">Est. prep time:</span> ${calculatePrepTime(order.items)} minutes
          </div>
        </div>
        <div class="kitchen-order-footer">
          <button class="primary mark-ready" data-id="${order.order_id}">
            Mark as Ready
          </button>
        </div>
      `;
      
      kitchenPreparingOrders.appendChild(orderCard);
      
      // Add event listener
      orderCard.querySelector('.mark-ready').addEventListener('click', () => {
        updateOrderStatus(order.order_id, 'ready');
      });
    });
  }
  
  // Completed orders
  const kitchenCompletedOrders = document.getElementById('kitchen-completed-orders');
  const noCompletedToday = document.getElementById('no-completed-today');
  
  const completedOrders = orders.filter(order => 
    order.status === 'ready' || order.status === 'delivered'
  );
  
  if (completedOrders.length === 0) {
    kitchenCompletedOrders.classList.add('hidden');
    noCompletedToday.classList.remove('hidden');
  } else {
    kitchenCompletedOrders.classList.remove('hidden');
    noCompletedToday.classList.add('hidden');
    
    kitchenCompletedOrders.innerHTML = '';
    
    completedOrders.forEach(order => {
      const orderCard = document.createElement('div');
      orderCard.className = `kitchen-order-card ${order.status === 'ready' ? 'ready' : ''}`;
      
      orderCard.innerHTML = `
        <div class="kitchen-order-header ${order.status === 'ready' ? 'ready' : ''}">
          <div class="kitchen-order-title">
            <span>Order #${order.order_id}</span>
            <span class="badge ${order.status === 'ready' ? 'green' : 'gray'}">
              ${order.status === 'ready' ? 'Ready' : 'Delivered'}
            </span>
          </div>
          <div class="kitchen-order-subtitle">
            <span>Table ${order.table_number}</span>
            <span>${new Date(order.created_at).toLocaleTimeString()}</span>
          </div>
        </div>
        <div class="kitchen-order-content">
          <div class="kitchen-order-items simple">
            ${order.items.map(item => `
              <div><span class="font-medium">${item.quantity}x</span> ${item.menu_item_name}</div>
            `).join('')}
          </div>
        </div>
      `;
      
      kitchenCompletedOrders.appendChild(orderCard);
    });
  }
}

// Calculate the preparation time for all items in an order
function calculatePrepTime(orderItems) {
  if (!orderItems || orderItems.length === 0) return 0;
  
  const prepTimes = orderItems.map(item => {
    // Look up the menu item to get its preparation time
    const menuItem = menuItems.find(mi => mi.item_id === item.menu_item_id);
    return menuItem ? menuItem.preparation_time : 10; // Default to 10 min if not found
  });
  
  return Math.max(...prepTimes);
}

// =====================
// Event Listeners
// =====================
function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      const tabsContainer = tab.closest('.tabs');
      const tabContentContainer = tabsContainer.nextElementSibling.parentElement;
      
      // Deactivate all tabs
      tabsContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tabContentContainer.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Activate selected tab
      tab.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Login form
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    login(username, password);
  });
  
  // Back to customer button in login view
  document.getElementById('back-to-customer').addEventListener('click', () => {
    hideLoginView();
    setUserRole('customer');
  });
  
  // Logout button
  document.getElementById('logout-btn').addEventListener('click', logout);
  
  // Role buttons
  document.getElementById('customer-btn').addEventListener('click', () => setUserRole('customer'));
  document.getElementById('staff-btn').addEventListener('click', () => setUserRole('staff'));
  document.getElementById('kitchen-btn').addEventListener('click', () => setUserRole('kitchen'));
  
  // Menu search
  document.getElementById('menu-search').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    fetchMenuItems();
  });
  
  // Menu type selection
  document.querySelectorAll('input[name="menu-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      fetchMenuCategories();
      fetchMenuItems();
    });
  });
  
  // Place order button
  document.getElementById('place-order-btn').addEventListener('click', placeOrder);
  
  // New order button
  document.getElementById('new-order-btn').addEventListener('click', () => setUserRole('customer'));
}

// Initialize the application
function initApp() {
  // Set up event listeners
  setupEventListeners();
  
  // Check for logged in user
  if (currentUser) {
    connectSocket();
    updateUserInfo();
    setUserRole(currentUser.role);
  } else {
    setUserRole('customer');
  }
}
