require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`   Architect PMS API Server is active on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Server Error] Port ${PORT} is already in use by another process.`);
        console.error(`If you already have a server running in another window, port 5000 is active.`);
        process.exit(1);
      } else {
        console.error('[Server Error]:', err);
      }
    });
  } catch (error) {
    console.error('Failed to launch server:', error);
    process.exit(1);
  }
};

startServer();
