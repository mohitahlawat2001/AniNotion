const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    logger.info('🔗 Attempting to connect to MongoDB...', {
      mongoUri: process.env.MONGODB_URI ? '***SET***' : '***MISSING***',
    });

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    logger.info('✅ MongoDB Connected successfully', {
      host: conn.connection.host,
      database: conn.connection.name,
      port: conn.connection.port,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', {
      error: error.message,
      stack: error.stack,
    });

    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
