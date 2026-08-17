import app from './app';
import { env } from './config/env';
import { workerManager } from './workers/worker.manager';
import { closeRedisConnection } from './config/redis.config';
import prisma from './config/prisma';

// Initialize BullMQ background workers and fallback processors
workerManager.initialize();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});

// Graceful Shutdown Handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('[Server] HTTP server closed.');

    try {
      await workerManager.shutdown();
      await closeRedisConnection();
      await prisma.$disconnect();
      console.log('[Server] Database and queue connections closed. Process exiting cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error during graceful shutdown:', err);
      process.exit(1);
    }
  });

  // Force exit after 10s if shutdown hangs
  setTimeout(() => {
    console.error('[Server] Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
