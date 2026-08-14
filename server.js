try { require('dotenv').config(); } catch (e) {}
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== Uploads folder (auto-create) =====
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// ===== Multer setup (photo upload) =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, Date.now() + '-' + safe);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'));
  }
});

// ===== MongoDB Connection =====
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/socialmedia';

mongoose.connect(MONGO_URI, { 
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('⚠️ DB Connection Error:', err.message);
    console.log('💡 Is MongoDB running? Check: mongod');
  });

// ===== Models =====
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  bio: { type: String, default: 'Hey there! I am using ConnectApp.' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  joined: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: String,
  image: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    date: { type: Date, default: Date.now }
  }],
  date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);

// ===== Auth Routes =====
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: 'Email is already registered!' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();
    
    res.json({ success: true, message: 'Account created! Please login now.' });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password!' });
    }
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password!' });
    }
    
    res.json({ 
      success: true, 
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email,
        bio: user.bio
      } 
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// ===== User Routes =====
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('name email bio followers following');
    res.json(users);
  } catch (e) {
    console.error('Users fetch error:', e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const posts = await Post.find({ author: user._id })
      .populate('author', 'name email')
      .populate('comments.author', 'name')
      .sort({ date: -1 });
      
    res.json({ user, posts });
  } catch (e) {
    console.error('User profile error:', e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

app.post('/api/users/:id/follow', async (req, res) => {
  try {
    const myId = req.body.userId;
    
    if (myId === req.params.id) {
      return res.status(400).json({ error: "You can't follow yourself!" });
    }
    
    const target = await User.findById(req.params.id);
    const me = await User.findById(myId);
    
    if (!target || !me) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const already = target.followers.some(f => f.toString() === myId);
    
    if (already) {
      target.followers = target.followers.filter(f => f.toString() !== myId);
      me.following = me.following.filter(f => f.toString() !== target._id.toString());
    } else {
      target.followers.push(me._id);
      me.following.push(target._id);
    }
    
    await target.save();
    await me.save();
    
    res.json({ success: true, following: !already });
  } catch (e) {
    console.error('Follow error:', e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// ===== Post Routes =====
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name email')
      .populate('comments.author', 'name')
      .sort({ date: -1 });
    res.json(posts);
  } catch (e) {
    console.error('Posts fetch error:', e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// ✅ Photo upload support (FIXED)
app.post('/api/posts', upload.single('image'), async (req, res) => {
  try {
    console.log('📝 Post create attempt:', { body: req.body, file: req.file });
    
    const body = req.body || {};
    const author = body.author;
    const content = body.content || '';
    const imageUrl = body.imageUrl || '';
    
    if (!author) {
      return res.status(400).json({ error: 'Please login first!' });
    }
    
    if (!content.trim() && !req.file && !imageUrl.trim()) {
      return res.status(400).json({ error: 'Post cannot be empty' });
    }
    
    const image = req.file ? '/uploads/' + req.file.filename : imageUrl.trim();
    
    const post = new Post({ 
      author, 
      content: content.trim(), 
      image 
    });
    
    await post.save();
    console.log('✅ Post saved:', post._id);
    
    res.json({ success: true, post });
  } catch (e) {
    console.error('❌ Post create error:', e);
    res.status(500).json({ error: 'Post not saved: ' + e.message });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const uid = req.body.userId;
    const alreadyLiked = post.likes.some(l => l.toString() === uid);
    
    if (alreadyLiked) {
      post.likes = post.likes.filter(l => l.toString() !== uid);
    } else {
      post.likes.push(uid);
    }
    
    await post.save();
    res.json({ success: true, likes: post.likes.length });
  } catch (e) {
    console.error('Like error:', e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

app.post('/api/posts/:id/comment', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    post.comments.push({ 
      author: req.body.userId, 
      text: req.body.text 
    });
    
    await post.save();
    res.json({ success: true });
  } catch (e) {
    console.error('Comment error:', e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// ===== Error Handler (IMPROVED) =====
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File must be smaller than 5MB!' });
    }
    return res.status(400).json({ error: 'Upload error: ' + err.message });
  }
  
  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: 'Only photo files are allowed!' });
  }
  
  res.status(500).json({ error: 'Server error: ' + err.message });
});

// ===== Server Start =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
  console.log(`📁 Upload folder: ${uploadDir}`);
});