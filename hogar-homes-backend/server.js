// Updated server.js with debug logging

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hogarhomes')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Property Model
const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  squareFeet: { type: Number },
  images: [{
    url: String,
    publicId: String,
    description: String,
    thumbnailUrl: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const Property = mongoose.model('Property', propertySchema);

// Configure Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hogar-homes/properties',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: 'limit',
        quality: 'auto:good'
      }
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1E9);
      return `property-${timestamp}-${random}`;
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// ===== ROUTES SECTION =====
console.log('🔧 Registering routes...');

// Root route - WITH DEBUG LOGGING
app.get('/', (req, res) => {
  console.log('🏠 Root route accessed!');
  res.send(`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
      <h1>🚀 Hogar Homes API is live!</h1>
      <p><strong>Status:</strong> ✅ Running</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p><strong>Port:</strong> ${process.env.PORT || 3001}</p>
      <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
      
      <h3>🔗 API Endpoints:</h3>
      <ul>
        <li><a href="/api/health" style="color: #007bff;">GET /api/health</a> - Health check</li>
        <li><a href="/api/properties" style="color: #007bff;">GET /api/properties</a> - List all properties</li>
        <li style="color: #666;">POST /api/properties - Create property</li>
        <li style="color: #666;">POST /api/upload - Upload images</li>
      </ul>
      
      <h3>🔧 System Info:</h3>
      <ul>
        <li><strong>Cloudinary:</strong> ${!!process.env.CLOUDINARY_CLOUD_NAME ? '✅ Enabled' : '❌ Disabled'}</li>
        <li><strong>MongoDB:</strong> ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}</li>
        <li><strong>Node.js:</strong> ${process.version}</li>
      </ul>
    </div>
  `);
});
console.log('✅ Root route registered');

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('💚 Health check accessed');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
    mongodb: mongoose.connection.readyState === 1,
    uptime: process.uptime()
  });
});
console.log('✅ Health route registered');

// File upload endpoint
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  console.log('📤 Upload endpoint accessed');
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      size: file.size,
      thumbnailUrl: cloudinary.url(file.filename, {
        width: 300,
        height: 200,
        crop: 'fill',
        quality: 'auto:good'
      })
    }));

    console.log(`✅ Successfully uploaded ${uploadedFiles.length} files`);
    res.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});
console.log('✅ Upload route registered');

// Property Routes
app.get('/api/properties', async (req, res) => {
  console.log('🏘️ Properties list accessed');
  try {
    const properties = await Property.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${properties.length} properties`);
    res.json(properties);
  } catch (error) {
    console.error('❌ Properties fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  console.log(`🏠 Property ${req.params.id} accessed`);
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error('❌ Property fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/properties', async (req, res) => {
  console.log('➕ Create property accessed');
  try {
    console.log('Received property data:', req.body);
    const property = new Property(req.body);
    await property.save();
    console.log('✅ Property saved:', property._id);
    res.status(201).json(property);
  } catch (error) {
    console.error('❌ Property save error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/properties/:id', async (req, res) => {
  console.log(`✏️ Update property ${req.params.id} accessed`);
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    console.log('✅ Property updated:', property._id);
    res.json(property);
  } catch (error) {
    console.error('❌ Property update error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/properties/:id', async (req, res) => {
  console.log(`🗑️ Delete property ${req.params.id} accessed`);
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Delete images from Cloudinary
    if (property.images && property.images.length > 0) {
      const deletePromises = property.images.map(image => {
        if (image.publicId) {
          return cloudinary.uploader.destroy(image.publicId);
        }
      });
      
      try {
        await Promise.all(deletePromises);
        console.log('✅ Images deleted from Cloudinary');
      } catch (cloudinaryError) {
        console.error('⚠️ Error deleting images from Cloudinary:', cloudinaryError);
      }
    }
    
    console.log('✅ Property deleted successfully');
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('❌ Property delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

console.log('✅ All property routes registered');

// Catch-all for unmatched routes
app.use('*', (req, res) => {
  console.log(`❓ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found', 
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/properties',
      'POST /api/properties',
      'POST /api/upload'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Server error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
  }
  res.status(500).json({ error: 'Internal server error' });
});
console.log('✅ Error handling middleware registered');

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`☁️ Cloudinary enabled: ${!!process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`📊 MongoDB connection: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
  console.log(`🔗 Available at: https://hogar-homes-2.onrender.com`);
  console.log('🎯 All routes registered and server ready!');
});