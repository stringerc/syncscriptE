console.log('🚀 Starting minimal test server...');

try {
  const express = require('express');
  console.log('✅ Express loaded successfully');
  
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

  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Test server running on port ${PORT}`);
    console.log(`🌐 Server listening on 0.0.0.0:${PORT}`);
    console.log(`✅ Health check available at /health`);
  });

} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
