import { createServer, Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import fs from 'fs';
import colors from 'colors';
import { validateConfig } from './DB/configValidation';
import { connectToDatabase } from './DB/db';
import app from './app';
import config from './config';
import { logger } from './shared/logger';
import { setupProcessHandlers } from './DB/processHandlers';
import { setupSecurity } from './DB/security';
import { setupQueueEvents, setupWorkerEvents } from './DB/bullMQ';
import { startRealtimeMonitoring } from './scripts/startRealtimeMonitoring';
import { initSocket } from './helpers/socket/socket';
import { connectToRedis } from './DB/redis';

export let httpServer: HttpServer;
export let socketServer: SocketServer;

async function startServer(): Promise<void> {
     try {
          // Validate config first
          validateConfig();

          // Connect to database
          await connectToDatabase();

          // Create HTTP server
          httpServer = createServer(app);
          const socketPath = config.socket_path;
          const httpPort = Number(config.port) || 5004;
          const ipAddress = config.ip_address as string || '0.0.0.0';

          // Set timeouts
          httpServer.timeout = 120000;
          httpServer.keepAliveTimeout = 5000;
          httpServer.headersTimeout = 60000;

          // ==========================================
          // ✅ SOCKET.IO SETUP (With Redis Adapter)
          // ==========================================
          socketServer = await initSocket(httpServer);

          logger.info(
               colors.bgYellow(
                    `♻️  Socket.IO initialized with Redis Adapter on PID ${process.pid}`,
               ),
          );

          // Start HTTP server
          await new Promise<void>((resolve, reject) => {
               if (socketPath) {
                    // পুরানো সকেট ফাইল থেকে থাকলে রিমুভ করা
                    if (fs.existsSync(socketPath)) {
                         fs.unlinkSync(socketPath);
                    }

                    // UNIX সকেট ফাইলে লিসেন করা
                    httpServer.listen(socketPath, () => {
                         // Apache রিভার্স প্রক্সি যাতে রিড/রাইট করতে পারে
                         fs.chmodSync(socketPath, '0777');
                         logger.info(
                              colors.bgCyan.bold.white(
                                   `♻️  Server (PID: ${process.pid}) listening on UNIX Socket: ${socketPath}`,
                              ),
                         );
                         resolve();
                    });
               } else {
                    // রেগুলার TCP পোর্টে লিসেন করা (Local development-এর জন্য)
                    httpServer.listen(httpPort, ipAddress, () => {
                         logger.info(
                              colors.bgCyan.bold.white(
                                   `♻️  Server (PID: ${process.pid}) listening on http://${ipAddress}:${httpPort}`,
                              ),
                         );
                         resolve();
                    });
               }
               httpServer.on('error', reject);
          });
     } catch (error) {
          logger.error(colors.red(`Server (PID: ${process.pid}) failed to start:`), error);
          throw error;
     }
}

// ==========================================
// ENTRY POINT - Runs once at startup
// ==========================================
async function main() {
     try {
          // Setup security headers
          setupSecurity();

          // Setup graceful shutdown handlers
          setupProcessHandlers();

          // ✅ Connect to Redis FIRST
          await connectToRedis();

          // Start the server (Database & Socket)
          await startServer();

          // Setup BullMQ events
          setupQueueEvents();
          setupWorkerEvents();

          // Start monitoring (only in production)
          if (config.node_env === 'production') {
               startRealtimeMonitoring();
          }

          logger.info(
               colors.green.bold(
                    `✅ Server bootstrap completed successfully (PID: ${process.pid})`,
               ),
          );
     } catch (error) {
          logger.error(colors.red('❌ Bootstrap failed:'), error);
          process.exit(1);
     }
}

main();