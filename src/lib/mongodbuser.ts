// lib/mongodbUsers.ts
import mongoose, { Mongoose } from "mongoose";

const MONGO_USERS_URI = process.env.MONGO_URI!;

if (!MONGO_USERS_URI) {
  throw new Error("❌ MONGO_URI is not defined in .env");
}

interface MongooseGlobal {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// @ts-ignore
let cached: MongooseGlobal = global.mongooseUsers;

if (!cached) {
  // @ts-ignore
  cached = global.mongooseUsers = { conn: null, promise: null };
}

export async function connectToMongoUsers(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_USERS_URI, {
      bufferCommands: false,
      dbName: "v2Reporting", // 👈 bien préciser
    }).then(mongoose => {
      console.log("✅ Connecté à DB v2Reporting :", mongoose.connection.name);
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
