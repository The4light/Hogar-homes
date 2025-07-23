// Minimal server for testing - deploy this first to verify basic functionality

import express from 'express';

const app = express();

// Basic middleware
app.use(express.json());

// Test route - Multiple ways to access
app.get('/', (req, res) => {
  console.log('Root route accessed!');
  res.send(`
    <h1>🚀 Hogar Homes API is live!</h1>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    <p><strong>Port:</strong> ${process.env.PORT || 3001}</p>
    <p><strong>Node Version:</strong> ${process.version}</p>
    <div>
      <h3>Available endpoints:</h3>
      <ul>
        <li><a href="/api/health">/api/health</a></li>
        <li><a href="/api/test">/api/test</a></li>
      </ul>
    </div>
  `);
});

// Additional test routes
app.get('/api/health', (req, res) => {
  console.log('Health check accessed!');
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/test', (req, res) => {
  console.log('Test route accessed!');
  res.json({ 
    message: 'Test endpoint working!',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found', 
    method: req.method,
    path: req.originalUrl 
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Node version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
});