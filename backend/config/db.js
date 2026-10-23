const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multitenant_ecommerce";
    if (!process.env.MONGO_URI) {
      console.warn("⚠️ Warning: MONGO_URI .env me define nahi hai, local fallback use ho raha hai.");
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;