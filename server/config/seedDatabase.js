const mongoose = require('mongoose');
const User = require('../models/user');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const bcrypt = require('bcrypt');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for seeding');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await MenuCategory.deleteMany({});
    await MenuItem.deleteMany({});
    await Table.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Seed users
    const usersData = [
      { username: 'staff1', password: hashedPassword, name: 'Staff User', role: 'staff' },
      { username: 'kitchen1', password: hashedPassword, name: 'Kitchen User', role: 'kitchen' },
      { username: 'admin1', password: hashedPassword, name: 'Admin User', role: 'admin' }
    ];
    
    const users = await User.insertMany(usersData);
    console.log('Seeded users');
    
    // Seed menu categories
    const categoriesData = [
      { name: 'Soups', description: 'Hearty Vietnamese soups' },
      { name: 'Rice & Noodles', description: 'Traditional rice and noodle dishes' },
      { name: 'Desserts', description: 'Sweet treats to finish your meal' },
      { name: 'Drinks', description: 'Refreshing beverages' }
    ];
    
    const categories = await MenuCategory.insertMany(categoriesData);
    console.log('Seeded menu categories');
    
    // Create a map for easy lookup
    const categoryMap = {
      1: categories[0]._id, // Soups
      2: categories[1]._id, // Rice & Noodles
      3: categories[2]._id, // Desserts
      4: categories[3]._id  // Drinks
    };
    
    // Seed menu items
    const menuItemsData = [
      // Soups (category_id: 1)
      { 
        category: categoryMap[1], 
        category_id: 1,
        name: 'Phở Bò', 
        price: 9.50, 
        image_path: '/images/pho-bo.jpg', 
        description: 'Traditional beef noodle soup with herbs and bean sprouts', 
        preparation_time: 18,
        item_id: 101
      },
      { 
        category: categoryMap[1], 
        category_id: 1,
        name: 'Bún Bò Huế', 
        price: 10.50, 
        image_path: '/images/bun-bo-hue.jpg', 
        description: 'Spicy beef noodle soup from central Vietnam', 
        preparation_time: 20,
        item_id: 102
      },
      { 
        category: categoryMap[1], 
        category_id: 1,
        name: 'Canh Chua Cá', 
        price: 5.50, 
        image_path: '/images/canh-chua.jpg', 
        description: 'Sweet and sour fish soup with vegetables', 
        preparation_time: 15,
        item_id: 103
      },
      
      // Rice & Noodles (category_id: 2)
      { 
        category: categoryMap[2], 
        category_id: 2,
        name: 'Cơm Chiên Hải Sản', 
        price: 11.00, 
        image_path: '/images/com-chien.jpg', 
        description: 'Seafood fried rice', 
        preparation_time: 15,
        item_id: 201
      },
      { 
        category: categoryMap[2], 
        category_id: 2,
        name: 'Bánh Mì Thịt', 
        price: 8.50, 
        image_path: '/images/banh-mi.jpg', 
        description: 'Vietnamese sandwich with various meats and vegetables', 
        preparation_time: 10,
        item_id: 202
      },
      { 
        category: categoryMap[2], 
        category_id: 2,
        name: 'Bún Chả', 
        price: 9.50, 
        image_path: '/images/bun-cha.jpg', 
        description: 'Grilled pork with rice noodles and herbs', 
        preparation_time: 20,
        item_id: 203
      },
      { 
        category: categoryMap[2], 
        category_id: 2,
        name: 'Cơm Tấm', 
        price: 10.50, 
        image_path: '/images/com-tam.jpg', 
        description: 'Broken rice with grilled pork, egg, and vegetables', 
        preparation_time: 15,
        item_id: 204
      },
      { 
        category: categoryMap[2], 
        category_id: 2,
        name: 'Bánh Xèo', 
        price: 8.50, 
        image_path: '/images/banh-xeo.jpg', 
        description: 'Vietnamese crispy pancake with shrimp and bean sprouts', 
        preparation_time: 18,
        item_id: 205
      },
      
      // Desserts (category_id: 3)
      { 
        category: categoryMap[3], 
        category_id: 3,
        name: 'Chè Ba Màu', 
        price: 4.50, 
        image_path: '/images/che-ba-mau.jpg', 
        description: 'Three-color dessert with beans, jelly, and coconut milk', 
        preparation_time: 8,
        item_id: 301
      },
      { 
        category: categoryMap[3], 
        category_id: 3,
        name: 'Bánh Flan', 
        price: 3.50, 
        image_path: '/images/banh-flan.jpg', 
        description: 'Vietnamese caramel custard', 
        preparation_time: 5,
        item_id: 302
      },
      { 
        category: categoryMap[3], 
        category_id: 3,
        name: 'Chè Đậu Xanh', 
        price: 4.00, 
        image_path: '/images/che-dau-xanh.jpg', 
        description: 'Mung bean pudding with coconut cream', 
        preparation_time: 6,
        item_id: 303
      },
      
      // Drinks (category_id: 4)
      { 
        category: categoryMap[4], 
        category_id: 4,
        name: 'Cà Phê Sữa Đá', 
        price: 2.50, 
        image_path: '/images/ca-phe-sua-da.jpg', 
        description: 'Vietnamese iced coffee with condensed milk', 
        preparation_time: 5,
        item_id: 401
      },
      { 
        category: categoryMap[4], 
        category_id: 4,
        name: 'Nước Chanh Muối', 
        price: 3.50, 
        image_path: '/images/nuoc-chanh-muoi.jpg', 
        description: 'Salted preserved lime juice', 
        preparation_time: 3,
        item_id: 402
      },
      { 
        category: categoryMap[4], 
        category_id: 4,
        name: 'Trà Đá', 
        price: 1.50, 
        image_path: '/images/tra-da.jpg', 
        description: 'Vietnamese iced tea', 
        preparation_time: 3,
        item_id: 403
      },
      { 
        category: categoryMap[4], 
        category_id: 4,
        name: 'Sinh Tố Bơ', 
        price: 4.50, 
        image_path: '/images/sinh-to-bo.jpg', 
        description: 'Avocado smoothie with condensed milk', 
        preparation_time: 5,
        item_id: 404
      }
    ];
    
    await MenuItem.insertMany(menuItemsData);
    console.log('Seeded menu items');
    
    // Seed tables
    const tablesData = [
      { table_number: 1, status: 'available', capacity: 2 },
      { table_number: 2, status: 'occupied', capacity: 2 },
      { table_number: 3, status: 'occupied', capacity: 4 },
      { table_number: 4, status: 'available', capacity: 4 },
      { table_number: 5, status: 'reserved', capacity: 6 },
      { table_number: 6, status: 'available', capacity: 6 },
      { table_number: 7, status: 'available', capacity: 8 },
      { table_number: 8, status: 'available', capacity: 8 }
    ];
    
    await Table.insertMany(tablesData);
    console.log('Seeded tables');
    
    console.log('Database successfully seeded!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Execute the seeding process
const runSeed = async () => {
  const connected = await connectDB();
  
  if (connected) {
    await seedDatabase();
    console.log('Completed. Disconnecting...');
    mongoose.disconnect();
  }
};

runSeed();