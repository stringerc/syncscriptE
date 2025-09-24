const express = require('express');
const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

console.log('🔧 Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Parsed PORT:', PORT);

// Simple health check
app.get('/health', (req, res) => {
  console.log('📊 Health check requested');
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0-test',
    port: PORT
  });
});

// Add a root endpoint for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'SyncScript Test Server',
    status: 'running',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`🌐 Server listening on 0.0.0.0:${PORT}`);
  console.log(`✅ Health check available at /health`);
  console.log(`✅ Root endpoint available at /`);
});

// Handle errors
app.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
