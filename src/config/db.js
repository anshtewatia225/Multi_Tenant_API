const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[db] MONGO_URI is not set. Check your .env file.');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri, {
      // These are sensible defaults; Mongoose 8 ignores the legacy flags.
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[db] MongoDB connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
  });
}

module.exports = connectDB;
