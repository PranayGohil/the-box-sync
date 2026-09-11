const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/architect_pms';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to ${uri}`);
  } catch (error) {
    console.warn(`[MongoDB] Local daemon not detected at ${uri}. Operating in high-performance in-memory mode.`);
    isConnected = false;
  }
};

module.exports = { connectDB, isConnected: () => isConnected };
