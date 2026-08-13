// server.js
try { require('dotenv').config(); } catch (e) {}
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');

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
  .catch(err => console.log('⚠️ DB Connection Issue:', err.message));

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

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

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
    console.error('Seed error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (e) {
    console.error('Products fetch error:', e);
    res.status(500).json({ error: e.message });
  }
});

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered!' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();
    res.json({ success: true, message: 'Registration successful!' });
  } catch (e) {
    console.error('Register error:', e);
    // Duplicate key or other DB error
    res.status(500).json({ error: e.message });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password!' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid email or password!' });

    res.json({ success: true, user: { name: user.name, email: user.email } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Create Order
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.json({ success: true, message: 'Order saved to MongoDB!' });
  } catch (e) {
    console.error('Order save error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (e) {
    console.error('Orders fetch error:', e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));