import mongoose from 'mongoose';

const MONGO_URL = process.env.MONGO_URL; // Ensure to set this environment variable

if (!MONGO_URL) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGO_URL, opts).then((mongoose) => {
            return mongoose; // Return the mongoose instance
        });
    }
    cached.conn = await cached.promise;
    return cached.conn; // Return the mongoose instance
}

export default dbConnect;
