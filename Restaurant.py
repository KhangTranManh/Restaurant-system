from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit, join_room
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import json
import uuid

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SECRET_KEY'] = 'resto_management_secret_key'
CORS(app)
# Use threading mode instead of eventlet for Python 3.13 compatibility
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# In-memory data storage (replace with database later)
# Sample users for authentication
users = [
    {"user_id": 1, "username": "staff1", "password": generate_password_hash("password123"), "name": "Staff User", "role": "staff"},
    {"user_id": 2, "username": "kitchen1", "password": generate_password_hash("password123"), "name": "Kitchen User", "role": "kitchen"},
    {"user_id": 3, "username": "admin1", "password": generate_password_hash("password123"), "name": "Admin User", "role": "admin"}
]

menu_categories = [
    {"category_id": 1, "name": "Soups", "description": "Hearty Vietnamese soups"},
    {"category_id": 2, "name": "Rice & Noodles", "description": "Traditional rice and noodle dishes"},
    {"category_id": 3, "name": "Desserts", "description": "Sweet treats to finish your meal"},
    {"category_id": 4, "name": "Drinks", "description": "Refreshing beverages"}
]

# Sample menu items
menu_items = [
    # Soups (category_id: 1)
    {"item_id": 101, "category_id": 1, "name": "Phở Bò", "price": 9.50, "image_path": "/images/pho-bo.jpg", "description": "Traditional beef noodle soup with herbs and bean sprouts", "preparation_time": 18},
    {"item_id": 102, "category_id": 1, "name": "Bún Bò Huế", "price": 10.50, "image_path": "/images/bun-bo-hue.jpg", "description": "Spicy beef noodle soup from central Vietnam", "preparation_time": 20},
    {"item_id": 103, "category_id": 1, "name": "Canh Chua Cá", "price": 5.50, "image_path": "/images/canh-chua.jpg", "description": "Sweet and sour fish soup with vegetables", "preparation_time": 15},
    
    # Rice & Noodles (category_id: 2)
    {"item_id": 201, "category_id": 2, "name": "Cơm Chiên Hải Sản", "price": 11.00, "image_path": "/images/com-chien.jpg", "description": "Seafood fried rice", "preparation_time": 15},
    {"item_id": 202, "category_id": 2, "name": "Bánh Mì Thịt", "price": 8.50, "image_path": "/images/banh-mi.jpg", "description": "Vietnamese sandwich with various meats and vegetables", "preparation_time": 10},
    {"item_id": 203, "category_id": 2, "name": "Bún Chả", "price": 9.50, "image_path": "/images/bun-cha.jpg", "description": "Grilled pork with rice noodles and herbs", "preparation_time": 20},
    {"item_id": 204, "category_id": 2, "name": "Cơm Tấm", "price": 10.50, "image_path": "/images/com-tam.jpg", "description": "Broken rice with grilled pork, egg, and vegetables", "preparation_time": 15},
    {"item_id": 205, "category_id": 2, "name": "Bánh Xèo", "price": 8.50, "image_path": "/images/banh-xeo.jpg", "description": "Vietnamese crispy pancake with shrimp and bean sprouts", "preparation_time": 18},
    
    # Desserts (category_id: 3)
    {"item_id": 301, "category_id": 3, "name": "Chè Ba Màu", "price": 4.50, "image_path": "/images/che-ba-mau.jpg", "description": "Three-color dessert with beans, jelly, and coconut milk", "preparation_time": 8},
    {"item_id": 302, "category_id": 3, "name": "Bánh Flan", "price": 3.50, "image_path": "/images/banh-flan.jpg", "description": "Vietnamese caramel custard", "preparation_time": 5},
    {"item_id": 303, "category_id": 3, "name": "Chè Đậu Xanh", "price": 4.00, "image_path": "/images/che-dau-xanh.jpg", "description": "Mung bean pudding with coconut cream", "preparation_time": 6},
    
    # Drinks (category_id: 4)
    {"item_id": 401, "category_id": 4, "name": "Cà Phê Sữa Đá", "price": 2.50, "image_path": "/images/ca-phe-sua-da.jpg", "description": "Vietnamese iced coffee with condensed milk", "preparation_time": 5},
    {"item_id": 402, "category_id": 4, "name": "Nước Chanh Muối", "price": 3.50, "image_path": "/images/nuoc-chanh-muoi.jpg", "description": "Salted preserved lime juice", "preparation_time": 3},
    {"item_id": 403, "category_id": 4, "name": "Trà Đá", "price": 1.50, "image_path": "/images/tra-da.jpg", "description": "Vietnamese iced tea", "preparation_time": 3},
    {"item_id": 404, "category_id": 4, "name": "Sinh Tố Bơ", "price": 4.50, "image_path": "/images/sinh-to-bo.jpg", "description": "Avocado smoothie with condensed milk", "preparation_time": 5}
]
# Sample tables
tables = [
    {"table_id": 1, "table_number": 1, "status": "available", "capacity": 2},
    {"table_id": 2, "table_number": 2, "status": "occupied", "capacity": 2},
    {"table_id": 3, "table_number": 3, "status": "occupied", "capacity": 4},
    {"table_id": 4, "table_number": 4, "status": "available", "capacity": 4},
    {"table_id": 5, "table_number": 5, "status": "reserved", "capacity": 6},
    {"table_id": 6, "table_number": 6, "status": "available", "capacity": 6},
    {"table_id": 7, "table_number": 7, "status": "available", "capacity": 8},
    {"table_id": 8, "table_number": 8, "status": "available", "capacity": 8}
]

# Sample orders
orders = [
    {
        "order_id": 1001,
        "table_id": 1,
        "table_number": 1,
        "status": "pending",
        "total_amount": 36.50,
        "created_at": datetime.now().isoformat(),
        "items": [
            {"order_item_id": 1, "menu_item_id": 101, "menu_item_name": "Spring Rolls", "quantity": 2, "item_price": 8.50, "special_instructions": "Extra sauce please"},
            {"order_item_id": 2, "menu_item_id": 201, "menu_item_name": "Grilled Salmon", "quantity": 1, "item_price": 22.50, "special_instructions": ""}
        ]
    },
    {
        "order_id": 1002,
        "table_id": 2,
        "table_number": 2,
        "status": "preparing",
        "total_amount": 24.00,
        "created_at": datetime.now().isoformat(),
        "items": [
            {"order_item_id": 3, "menu_item_id": 102, "menu_item_name": "Crispy Wontons", "quantity": 1, "item_price": 7.50, "special_instructions": ""},
            {"order_item_id": 4, "menu_item_id": 202, "menu_item_name": "Beef Stir Fry", "quantity": 1, "item_price": 19.50, "special_instructions": "Medium rare"}
        ]
    },
    {
        "order_id": 1003,
        "table_id": 3,
        "table_number": 3,
        "status": "ready",
        "total_amount": 31.50,
        "created_at": datetime.now().isoformat(),
        "items": [
            {"order_item_id": 5, "menu_item_id": 101, "menu_item_name": "Spring Rolls", "quantity": 1, "item_price": 8.50, "special_instructions": ""},
            {"order_item_id": 6, "menu_item_id": 202, "menu_item_name": "Beef Stir Fry", "quantity": 1, "item_price": 19.50, "special_instructions": ""},
            {"order_item_id": 7, "menu_item_id": 501, "menu_item_name": "Fresh Lemonade", "quantity": 1, "item_price": 4.50, "special_instructions": "No ice"}
        ]
    }
]

# Counter for new order IDs
order_counter = 1004

# =====================
# Authentication Routes
# =====================
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    # Find user
    user = next((u for u in users if u['username'] == username), None)
    
    if user and check_password_hash(user['password'], password):
        # Generate token (in a real app, use proper JWT)
        token = str(uuid.uuid4())
        
        # Return user info
        return jsonify({
            'token': token,
            'userId': user['user_id'],
            'username': user['username'],
            'name': user['name'],
            'role': user['role']
        })
    
    return jsonify({'message': 'Invalid credentials'}), 401

# =====================
# Menu Routes
# =====================
@app.route('/api/menu/categories', methods=['GET'])
def get_menu_categories():
    menu_type = request.args.get('menu_type', 'a-la-carte')
    # In a real app, filter by menu type
    return jsonify(menu_categories)

@app.route('/api/menu/items', methods=['GET'])
def get_menu_items():
    category_id = request.args.get('category_id')
    search = request.args.get('search', '')
    menu_type = request.args.get('menu_type', 'a-la-carte')
    
    # Filter items
    filtered_items = menu_items
    
    if category_id:
        try:
            category_id = int(category_id)
            filtered_items = [item for item in filtered_items if item['category_id'] == category_id]
        except ValueError:
            pass
    
    if search:
        search = search.lower()
        filtered_items = [item for item in filtered_items if search in item['name'].lower() or search in item['description'].lower()]
    
    # In a real app, filter by menu type as well
    
    return jsonify(filtered_items)

@app.route('/api/menu/items/<int:item_id>', methods=['GET'])
def get_menu_item(item_id):
    item = next((item for item in menu_items if item['item_id'] == item_id), None)
    if item:
        return jsonify(item)
    return jsonify({'message': 'Item not found'}), 404

# =====================
# Table Routes
# =====================
@app.route('/api/tables', methods=['GET'])
def get_tables():
    return jsonify(tables)

@app.route('/api/tables/<int:table_id>', methods=['GET'])
def get_table(table_id):
    table = next((table for table in tables if table['table_id'] == table_id), None)
    if table:
        return jsonify(table)
    return jsonify({'message': 'Table not found'}), 404

@app.route('/api/tables/<int:table_id>/status', methods=['PUT'])
def update_table_status(table_id):
    data = request.json
    new_status = data.get('status')
    
    table = next((table for table in tables if table['table_id'] == table_id), None)
    if not table:
        return jsonify({'message': 'Table not found'}), 404
    
    if new_status not in ['available', 'occupied', 'reserved']:
        return jsonify({'message': 'Invalid status'}), 400
    
    table['status'] = new_status
    
    # Update current order if needed
    if new_status == 'occupied':
        table['current_order_id'] = data.get('order_id')
    elif new_status == 'available':
        if 'current_order_id' in table:
            del table['current_order_id']
    
    # Notify clients via WebSocket
    socketio.emit('tableStatusChanged', {
        'tableId': table_id, 
        'status': new_status
    })
    
    return jsonify(table)

# =====================
# Order Routes
# =====================
# Replace the get_orders function in your Restaurant Order Management Backend.py file
# with this updated version

@app.route('/api/orders', methods=['GET'])
def get_orders():
    table_id = request.args.get('table_id')
    status = request.args.get('status')
    
    filtered_orders = orders
    
    if table_id:
        try:
            table_id = int(table_id)
            filtered_orders = [order for order in filtered_orders if order['table_id'] == table_id]
        except ValueError:
            pass
    
    if status:
        filtered_orders = [order for order in filtered_orders if order['status'] == status]
    
    # Sort orders by creation date (newest first)
    filtered_orders = sorted(filtered_orders, key=lambda x: x['created_at'], reverse=True)
    
    return jsonify(filtered_orders)

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    order = next((order for order in orders if order['order_id'] == order_id), None)
    if order:
        return jsonify(order)
    return jsonify({'message': 'Order not found'}), 404

@app.route('/api/orders', methods=['POST'])
def create_order():
    global order_counter
    data = request.json
    
    # Validate required fields
    if not data.get('tableId') or not data.get('items'):
        return jsonify({'message': 'Table ID and items are required'}), 400
    
    table_id = data.get('tableId')
    
    # Find table
    table = next((table for table in tables if table['table_id'] == table_id), None)
    if not table:
        return jsonify({'message': 'Table not found'}), 404
    
    # Calculate total amount
    total_amount = 0
    order_items = []
    for idx, item_data in enumerate(data.get('items')):
        menu_item_id = item_data.get('menuItemId')
        quantity = item_data.get('quantity', 1)
        special_instructions = item_data.get('specialInstructions', '')
        
        # Find menu item
        menu_item = next((item for item in menu_items if item['item_id'] == menu_item_id), None)
        if not menu_item:
            return jsonify({'message': f'Menu item {menu_item_id} not found'}), 404
        
        # Calculate item price
        item_price = menu_item['price']
        item_total = item_price * quantity
        total_amount += item_total
        
        # Create order item
        order_items.append({
            'order_item_id': 100 + idx,
            'menu_item_id': menu_item_id,
            'menu_item_name': menu_item['name'],
            'quantity': quantity,
            'item_price': item_price,
            'special_instructions': special_instructions
        })
    
    # Create order
    new_order = {
        'order_id': order_counter,
        'table_id': table_id,
        'table_number': table['table_number'],
        'status': 'pending',
        'total_amount': total_amount,
        'created_at': datetime.now().isoformat(),
        'items': order_items
    }
    
    # Increment order counter
    order_counter += 1
    
    # Add order to list
    orders.append(new_order)
    
    # Update table status
    table['status'] = 'occupied'
    table['current_order_id'] = new_order['order_id']
    
    # Notify clients via WebSocket
    socketio.emit('newOrder', new_order)
    
    return jsonify(new_order), 201

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    data = request.json
    new_status = data.get('status')
    
    if new_status not in ['pending', 'preparing', 'ready', 'delivered', 'cancelled']:
        return jsonify({'message': 'Invalid status'}), 400
    
    order = next((order for order in orders if order['order_id'] == order_id), None)
    if not order:
        return jsonify({'message': 'Order not found'}), 404
    
    # Update order status
    old_status = order['status']
    order['status'] = new_status
    
    # If order is completed, update table status
    if new_status == 'delivered' and old_status != 'delivered':
        # Find the table
        table = next((table for table in tables if table['table_id'] == order['table_id']), None)
        if table and table.get('current_order_id') == order_id:
            # Check if there are other active orders for this table
            other_active_orders = [o for o in orders if o['table_id'] == order['table_id'] and o['order_id'] != order_id and o['status'] not in ['delivered', 'cancelled']]
            
            if not other_active_orders:
                # No other active orders, set table to available
                table['status'] = 'available'
                if 'current_order_id' in table:
                    del table['current_order_id']
                
                # Notify about table change
                socketio.emit('tableStatusChanged', {
                    'tableId': table['table_id'], 
                    'status': 'available'
                })
    
    # Notify clients via WebSocket
    socketio.emit('orderStatusChanged', {
        'orderId': order_id, 
        'status': new_status,
        'timestamp': datetime.now().isoformat()
    })
    
    return jsonify(order)

# =====================
# WebSocket routes
# =====================
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join')
def handle_join(data):
    role = data.get('role', 'customer')
    # Join room based on role
    join_room(role)
    print(f"Client joined {role} room")

# =====================
# Static Files (for frontend)
# =====================
@app.route('/', methods=['GET'])
def index():
    return app.send_static_file('views/index.html')

@app.route('/views/<path:path>', methods=['GET'])
def views(path):
    return app.send_static_file(f'views/{path}')

@app.route('/<path:path>', methods=['GET'])
def static_files(path):
    return app.send_static_file(path)

# =====================
# Main Function
# =====================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)  