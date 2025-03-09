// lib/db.js
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MONGODB_URI to .env.local");
}

const MONGODB_URI = process.env.MONGODB_URI;

// Database configuration
const dbConfig = {
  dbName: "Store",
  collections: {
    users: "users",
  },
};

let cached = global;
cached.mongo = cached.mongo || { conn: null, promise: null };

async function connectDB() {
  if (cached.mongo.conn) {
    return cached.mongo.conn;
  }

  if (!cached.mongo.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.mongo.promise = MongoClient.connect(MONGODB_URI, opts);
  }

  try {
    const client = await cached.mongo.promise;
    cached.mongo.conn = client.db(dbConfig.dbName);
  } catch (e) {
    cached.mongo.promise = null;
    throw e;
  }

  return cached.mongo.conn;
}

// Export both the connection function and collections config
export { connectDB, dbConfig };
export default connectDB;
