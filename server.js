try { require('dotenv').config(); } catch (e) {}
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== MongoDB Connection =====
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce';

mongoose.connect(MONGO_URI, { 
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.log('⚠️ DB Connection Issue - Using Demo Mode:', err.message));

// ===== Models =====
const ProductSchema = new mongoose.Schema({
  name: String, 
  price: Number, 
  image: String, 
  description: String 
});

const UserSchema = new mongoose.Schema({
  name: String, 
  email: { type: String, unique: true }, 
  password: String 
});

const OrderSchema = new mongoose.Schema({
  customerName: String, 
  address: String, 
  phone: String,
  items: Array, 
  total: Number, 
  userEmail: String,
  date: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', ProductSchema);
const User = mongoose.model('User', UserSchema);
const Order = mongoose.model('Order', OrderSchema);

// ===== Routes =====

// Seed products
app.get('/api/seed', async (req, res) => {
  try {
    const count = await Product.countDocuments();
    if (count > 0) return res.json({ message: 'Products already exist' });
    
    const products = [
      { name: "Wireless Headphones", price: 2499, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60", description: "Experience crystal-clear sound quality with active noise cancellation and long-lasting battery life." },
      { name: "Smart Watch", price: 3999, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60", description: "Keep track of your health, notifications, and fitness goals with this sleek and modern smartwatch." },
      { name: "Minimalist Backpack", price: 1499, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60", description: "Durable, water-resistant, and spacious enough to carry all your daily essentials and laptop securely." },
      { name: "Mechanical Keyboard", price: 2999, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60", description: "Enhance your typing and gaming experience with RGB backlighting and responsive mechanical switches." }
    ];
    
    await Product.insertMany(products);
    res.json({ message: '✅ Products added to MongoDB!' });
  } catch (e) {
    res.json({ message: 'Demo mode - DB not connected' });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (e) {
    res.json([]);
  }
});

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered!' });
    
    const user = new User({ name, email, password });
    await user.save();
    res.json({ success: true, message: 'Registration successful!' });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed - DB issue' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(400).json({ error: 'Invalid email or password!' });
    
    res.json({ success: true, user: { name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ error: 'Login failed - DB issue' });
  }
});

// Create Order
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.json({ success: true, message: 'Order saved to MongoDB!' });
  } catch (e) {
    res.json({ success: true, message: 'Order placed (demo mode)' });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (e) {
    res.json([]);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));