import colors from 'colors';
import { Server } from 'socket.io';
import http from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { createSocketRedisClients } from '../../DB/redis';
import config from '../../config';
import { SocketAuthMiddleware } from '../../app/middleware/socketAuth';
import { ROLE_GROUPS } from '../../enums/user';
import { logger } from '../../shared/logger';
import { SOCKET_EVENTS } from '../../enums/socket_event';
import { User } from '../../app/modules/user/user.model';
import { SocketWithUser } from '../../interface/socket';
import { socketService } from './service';

const activeConnections = new Map<string, Set<string>>();

export const initSocket = async (httpServer: http.Server) => {
     const { pubClient, subClient } = await createSocketRedisClients();
     const allowedOrigins = config.allowed_origins
          ? config.allowed_origins.split(',').map((origin) => origin.trim())
          : ['*'];

     const io = new Server(httpServer, {
          cors: {
               origin: (origin, callback) => {
                    if (!origin || allowedOrigins.includes(origin)) {
                         callback(null, true);
                    } else {
                         callback(new Error('CORS blocked'));
                    }
               },
               credentials: true,
          },
          pingTimeout: 60000,
          pingInterval: 25000,
          adapter: createAdapter(pubClient, subClient),
     });

     socketService.init(io);
     io.use(SocketAuthMiddleware.socketAuth(...ROLE_GROUPS.ALL));

     io.on('connection', async (socket: SocketWithUser) => {
          const { id: userId } = socket.user as { id: string };
          if (!userId) {
               logger.warn(colors.yellow('Socket connected without valid user — disconnecting'));
               socket.disconnect(true);
               return;
          }
          logger.info(
               colors.blue(`✅ User connected & authenticated: ${userId} — PID: ${process.pid}`),
          );

          try {
               socket.join(userId);

               if (!activeConnections.has(userId)) {
                    activeConnections.set(userId, new Set());
               }
               activeConnections.get(userId)!.add(socket.id);
               await User.setUserOnline(userId);
               socketService.userOnline(io, userId);
               socket.emit(SOCKET_EVENTS.AUTHENTICATED, {
                    success: true,
                    userId,
               });
          } catch (error) {
               logger.error(colors.red(`Error during connection setup for user ${userId}:`), error);
          }

          // Heartbeat
          socket.on(SOCKET_EVENTS.HEARTBEAT, async () => {
               try {
                    await User.updateHeartbeat(userId);
               } catch (error) {
                    logger.error(colors.red(`Heartbeat update failed for ${userId}:`), error);
               }
          });

          // Online users query
          socket.on(SOCKET_EVENTS.GET_ONLINE_USERS, async () => {
               try {
                    const onlineUsers = await User.getOnlineUsers();
                    socket.emit('online_users_list', onlineUsers);
               } catch {
                    socket.emit('error', { message: 'Failed to fetch online users' });
               }
          });

          socket.on(SOCKET_EVENTS.GET_USERS_STATUS, async (userIds: string[]) => {
               try {
                    const usersWithStatus = await User.bulkUserStatus(userIds);
                    socket.emit('users_status', usersWithStatus);
               } catch {
                    socket.emit('error', { message: 'Failed to fetch users status' });
               }
          });

          // Typing indicators
          socket.on(
               SOCKET_EVENTS.TYPING_START,
               async ({
                    chatId,
                    participantIds,
                    senderName,
               }: {
                    chatId: string;
                    participantIds: string[];
                    senderName: string;
               }) => {
                    const others = participantIds.filter((id) => id !== userId);
                    socketService.typingStart(others, chatId, userId, senderName);
               },
          );

          socket.on(
               SOCKET_EVENTS.TYPING_STOP,
               async ({ chatId, participantIds }: { chatId: string; participantIds: string[] }) => {
                    const others = participantIds.filter((id) => id !== userId);
                    socketService.typingStop(others, chatId, userId);
               },
          );

          // Disconnect
          socket.on('disconnect', async () => {
               const sockets = activeConnections.get(userId);
               if (!sockets) return;

               sockets.delete(socket.id);

               if (sockets.size === 0) {
                    activeConnections.delete(userId);
                    try {
                         await User.setUserOffline(userId);
                         socketService.userOffline(io, userId);
                    } catch (error) {
                         logger.error(colors.red(`Error setting user offline ${userId}:`), error);
                    }
               }
          });
     });

     return io;
};
