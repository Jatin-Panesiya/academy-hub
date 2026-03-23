import http from 'node:http';
import mongoose from 'mongoose';

import { env } from './config/env.js';
import { connectMongo } from './config/mongoose.js';
import app from './src/app.js';

const server = http.createServer(app);

async function start() {
  await connectMongo(env.MONGODB_URI);

  server.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Ensure we stop accepting new requests and close the DB connection.
process.on('SIGINT', async () => {
  await mongoose.connection.close().catch(() => {});
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close().catch(() => {});
  server.close(() => process.exit(0));
});

