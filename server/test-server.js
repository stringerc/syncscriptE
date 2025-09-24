const express = require('express');
const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Simple health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0-test'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`✅ Health check available at /health`);
});

// Handle errors
app.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
