import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const persistentDbPath = path.join(__dirname, '../data/db');

let mongoMemoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vigithink_etmf';

  try {
    // Attempt connecting to local / external MongoDB first with 2.5s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[MongoDB] Connected to external/local database: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.warn(`[MongoDB] Local daemon not reachable at ${uri}. Initializing persistent embedded MongoDB...`);
    try {
      if (!fs.existsSync(persistentDbPath)) {
        fs.mkdirSync(persistentDbPath, { recursive: true });
      } else {
        const lockFile = path.join(persistentDbPath, 'mongod.lock');
        if (fs.existsSync(lockFile)) {
          try {
            fs.unlinkSync(lockFile);
            console.log('[MongoDB] Cleaned up stale mongod.lock file.');
          } catch (e) {
            // ignore if locked
          }
        }
      }
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbPath: persistentDbPath,
          storageEngine: 'wiredTiger',
          launchTimeout: 60000
        }
      });
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri, { dbName: 'vigithink_etmf' });
      console.log(`[MongoDB] Connected successfully to persistent embedded MongoDB at ${memoryUri} (Data Path: ${persistentDbPath})`);
    } catch (memErr) {
      console.warn('[MongoDB] Persistent dbPath locked or unavailable, falling back to standard instance...', memErr.message);
      if (mongoMemoryServer) {
        try { await mongoMemoryServer.stop(); } catch (e) {}
        mongoMemoryServer = null;
      }
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: { launchTimeout: 60000 }
      });
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri, { dbName: 'vigithink_etmf' });
      console.log(`[MongoDB] Connected to embedded MongoDB instance at ${memoryUri}`);
    }
  }

  mongoose.connection.on('error', (e) => {
    console.error('[MongoDB] Connection error:', e);
  });
};

export const closeDB = async () => {
  await mongoose.connection.close();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
