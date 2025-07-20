// lib/mongodb.ts
import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGOTRANSAC_URI!;

if (!MONGODB_URI) {
  throw new Error("❌ MONGOTRANSAC_URI is not defined in .env.local");
}

// On déclare globalThis.mongoose pour éviter la recréation en dev (hot-reload)
interface MongooseGlobal {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// @ts-ignore
let cached: MongooseGlobal = global.mongoose;

if (!cached) {
  // @ts-ignore
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToMongo(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
