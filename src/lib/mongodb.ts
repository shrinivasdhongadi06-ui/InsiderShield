import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'MONGODB_URI is not defined. Please set it in your .env.local file.'
  );
}

// ─── Connection Cache ─────────────────────────────────────────────────────────
// Prevent multiple connections in development due to hot reloading.
// Using global to persist the cached connection across module reloads.

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConnection: mongoose.Connection | null;
}

global.__mongooseConnection = global.__mongooseConnection ?? null;

/**
 * Connects to MongoDB, reusing existing connection if already established.
 * Safe to call in every API route.
 */
export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return; // Already connected
  }

  try {
    await mongoose.connect(MONGODB_URI as string);
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MongoDB] Connected successfully');
    }
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    throw error; // Re-throw so apiHandler can catch it
  }
}
