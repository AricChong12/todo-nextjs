// Import Mongoose.
// Mongoose is an ODM (Object Data Modeling) library used
// to interact with MongoDB using JavaScript/TypeScript objects.
import mongoose from 'mongoose';


// Define the structure of our cache object.
//
// conn:
//   Stores an active MongoDB connection.
//
// promise:
//   Stores a pending connection promise while connecting.
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}


// Extend the global Node.js object.
//
// This allows us to store a cached MongoDB connection globally,
// preventing multiple connections during development when
// Next.js hot-reloads files.
declare global {

  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}


/**
 * Global cached connection.
 *
 * Why is this needed?
 * -------------------
 * In Next.js development mode, files are frequently reloaded.
 * Without caching, each reload could create a new MongoDB
 * connection, eventually causing:
 *
 * - Too many open connections
 * - Performance issues
 * - Database connection limits being reached
 *
 * This cache ensures only one connection is reused.
 */

// Use existing global cache if available.
// Otherwise create a new cache object.
let cached = global.mongoose || {
  conn: null,
  promise: null,
};


// Store the cache globally if it doesn't exist yet.
if (!global.mongoose) {
  global.mongoose = cached;
}


/**
 * Connect to MongoDB.
 *
 * This function:
 * 1. Reads the MongoDB connection string.
 * 2. Reuses an existing connection if available.
 * 3. Creates a new connection if needed.
 * 4. Caches the connection for future use.
 */
async function dbConnect() {

  // Retrieve MongoDB URI from environment variables.
  const MONGODB_URI = process.env.MONGODB_URI;

  // Ensure the connection string exists.
  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }

  // If already connected, return the existing connection.
  if (cached.conn) {
    return cached.conn;
  }

  // If no connection attempt is currently running,
  // create one and store the promise.
  if (!cached.promise) {

    cached.promise = mongoose

      // Connect to MongoDB.
      .connect(MONGODB_URI, {

        // Disable command buffering.
        // Operations will fail immediately if not connected,
        // rather than waiting indefinitely.
        bufferCommands: false,
      })

      // Return the mongoose instance after connection.
      .then((m) => m);
  }

  try {

    // Wait for the connection promise to resolve.
    cached.conn = await cached.promise;

  } catch (e) {

    // Reset the promise if connection fails.
    // This allows future retry attempts.
    cached.promise = null;

    throw e;
  }

  // Return the active connection.
  return cached.conn;
}


// Export the connection helper so it can be used in:
// - API routes
// - Server actions
// - Authentication logic
// - Database queries
export default dbConnect;