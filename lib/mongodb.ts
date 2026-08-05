import mongoose from 'mongoose';

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

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env.local and add a connection string.');
  }

  if (!cache.promise) {
    // Fail fast instead of queueing operations against a database that is not there.
    cache.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  try {
    cache.connection = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.connection;
}
