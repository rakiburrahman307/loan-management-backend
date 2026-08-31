import { Server } from 'socket.io';

class SocketService {
     public io!: Server;

     init(io: Server) {
          this.io = io;
     }

     get instance(): Server {
          if (!this.io) throw new Error('SocketService not initialized. Call init(io) first.');
          return this.io;
     }

     // Emit event to a specific user (room-based for optimal scale)
     emit(event: string, userId: string, data: unknown) {
          this.instance.to(userId).emit(event, data);
     }

     // Emit event to all connected users
     emitToAll(event: string, data: unknown) {
          this.instance.emit(event, data);
     }

     // ─── Chat events ───────────────────────────────────────────────

     newChat(participantIds: string[], chat: unknown) {
          participantIds.forEach((id) => this.emit('newChat', id, chat));
     }

     chatListUpdate(
          participantIds: string[],
          payload: {
               chatId: string;
               chat?: unknown;
               action: string;
               lastMessage?: unknown;
               updatedAt?: Date;
               reactivated?: boolean;
          },
     ) {
          participantIds.forEach((id) => this.emit('chatListUpdate', id, payload));
     }

     chatMuteStatus(userId: string, chatId: string, isMuted: boolean, action: string) {
          this.emit('chatMuteStatus', userId, { chatId, isMuted, action });
     }

     userBlockStatus(
          userIds: string[],
          chatId: string,
          blockerId: string,
          blockedId: string,
          isBlocked: boolean,
          action: string,
     ) {
          userIds.forEach((id) =>
               this.emit('userBlockStatus', id, {
                    chatId,
                    blockerId,
                    blockedId,
                    isBlocked,
                    action,
               }),
          );
     }

     chatDeleted(userId: string, chatId: string, deletedAt: Date, isGloballyDeleted: boolean) {
          this.emit('notification', userId, { chatId, deletedAt, isGloballyDeleted });
     }

     chatGloballyDeleted(participantIds: string[], chatId: string, deletedAt: Date) {
          participantIds.forEach((id) =>
               this.emit('chatGloballyDeleted', id, { chatId, deletedAt }),
          );
     }

     chatListUpdateForOthers(otherParticipantIds: string[], chatId: string, updatedBy: string) {
          otherParticipantIds.forEach((id) =>
               this.emit('chatListUpdate', id, {
                    chatId,
                    updatedBy,
                    type: 'user_deleted_chat',
               }),
          );
     }

     chatReactivated(
          participantIds: string[],
          chatId: string,
          chat: unknown,
          lastMessage: unknown,
          reactivatedBy: string,
     ) {
          participantIds.forEach((id) =>
               this.emit('chatReactivated', id, {
                    chatId,
                    chat,
                    lastMessage,
                    reactivatedBy,
               }),
          );
     }

     // ─── Message events ────────────────────────────────────────────

     newMessage(participantIds: string[], message: unknown) {
          participantIds.forEach((id) => this.emit('newMessage', id, message));
     }

     unreadCountUpdate(participantIds: string[], chatId: string) {
          participantIds.forEach((id) =>
               this.emit('unreadCountUpdate', id, { chatId, action: 'increment' }),
          );
     }

     messagePinned(userId: string, messageId: string, chatId: unknown, message: unknown) {
          this.emit('messagePinned', userId, { messageId, chatId, pinnedBy: userId, message });
     }

     messageUnpinned(userId: string, messageId: string, chatId: unknown) {
          this.emit('messageUnpinned', userId, { messageId, chatId, unpinnedBy: userId });
     }

     // ─── User presence events ──────────────────────────────────────

     userOnline(io: Server, userId: string) {
          io.emit('user_online', { userId, isOnline: true, lastSeen: new Date() });
     }

     userOffline(io: Server, userId: string) {
          io.emit('user_offline', { userId, isOnline: false, lastSeen: new Date() });
     }

     // ─── Typing events ─────────────────────────────────────────────

     typingStart(participantIds: string[], chatId: string, senderId: string, senderName: string) {
          participantIds.forEach((id) =>
               this.emit('user_typing', id, { chatId, userId: senderId, name: senderName }),
          );
     }

     typingStop(participantIds: string[], chatId: string, senderId: string) {
          participantIds.forEach((id) =>
               this.emit('user_stopped_typing', id, { chatId, userId: senderId }),
          );
     }

     chatCleared(userId: string, chatId: string, clearTime: Date) {
          this.emit('chatCleared', userId, { chatId, clearedAt: clearTime });
     }
}

export const socketService = new SocketService();
