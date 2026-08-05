import mongoose from 'mongoose';

import { env } from '@/env/server';

// Imported from the module, not the barrel — this file is loaded by standalone
// scripts, and the barrel re-exports UI constants that pull in `lucide-react`.
import { DATABASE_NAME } from '@/constants/database.const';

/*
  Next.js reloads server modules on every change in development, and every route
  handler runs in its own module scope in production. Without a cache that means a
  fresh connection per reload, which exhausts the connection pool. The cache is
  parked on `globalThis` so it survives module re-evaluation.
*/
type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalWithMongoose.mongooseCache ?? { connection: null, promise: null };
globalWithMongoose.mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.connection) {
    return cache.connection;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(env.MONGODB_URI, {
      // Owned by the code, not by whoever pasted the connection string.
      dbName: DATABASE_NAME,
      // Fail fast instead of queueing operations against a database that is not there.
      bufferCommands: false,
    });
  }

  try {
    cache.connection = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.connection;
}
