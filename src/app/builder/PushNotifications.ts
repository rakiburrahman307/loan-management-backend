import mongoose from 'mongoose';
import { User } from '../modules/user/user.model';
import { DeviceToken } from '../modules/fcmToken/fcmToken.model';
import { Notification } from '../modules/notification/notification.model';
import { logger } from '../../shared/logger';
import colors from 'colors';
import admin from '../../firebase/firebase';

// 1. Define the Payload Interface (Type Safety)
export interface INotificationPayload {
     title: string;
     body: string;
     type: string;
     data?: Record<string, string>;
}
class NotificationHelper {
     /**
      * 🟢 MAIN METHOD: SEND TO SINGLE USER
      * Usage: NotificationHelper.sendToUser(userId, payload);
      */
     static async sendToUser(
          userId: string | mongoose.Types.ObjectId,
          payload: INotificationPayload,
     ) {
          // We just wrap the user in an array and call the core logic
          return this.sendToBatch([userId], payload);
     }

     /**
      * 🔵 MAIN METHOD: SEND TO MULTIPLE USERS
      * Usage: NotificationHelper.sendToBatch([id1, id2, id3], payload);
      */
     static async sendToBatch(
          userIds: (string | mongoose.Types.ObjectId)[],
          payload: INotificationPayload,
     ) {
          try {
               if (!userIds.length) return;

               // 1. Filter Users: Only get users who exist, are verified, and have notifications ON
               const validUsers = await User.find({
                    _id: { $in: userIds },
                    // isVerified: true,
                    // notificationStatus: true, // Assuming you have this toggle
               })
                    .select('_id')
                    .lean();

               const validUserIds = validUsers.map((u) => u._id);

               if (validUserIds.length === 0) return;

               // 2. Fetch FCM Tokens for these users
               const tokensData = await DeviceToken.find({
                    userId: { $in: validUserIds },
                    fcmToken: { $exists: true, $ne: '' },
               })
                    .select('fcmToken')
                    .lean();

               const fcmTokens = tokensData.map((t: any) => t.fcmToken);

               // --- PARALLEL EXECUTION START ---
               const tasks = [];

               // TASK A: Send Push Notifications (only if tokens exist)
               if (fcmTokens.length > 0) {
                    tasks.push(this.sendToFCM(fcmTokens, payload));
               }

               // TASK B: Save to Database (Always, even if they don't have a token)
               if (validUserIds.length > 0) {
                    tasks.push(this.saveToDatabase(validUserIds, payload));
               }

               await Promise.allSettled(tasks);
               // --- PARALLEL EXECUTION END ---

               logger.log(
                    colors.green(
                         `✅ Notification flow completed for ${validUserIds.length} users.`,
                    ),
               );
          } catch (error) {
               logger.error(colors.red('❌ NotificationHelper Error:'), error);
          }
     }
     static async sendChatMessage(chat: any, message: any) {
          try {
               const senderId = message.sender._id.toString();
               const senderName = message.sender.name || 'User';

               // message format body
               let bodyText = message.text;
               if (message.isDeleted) bodyText = 'This message was deleted';
               if (!bodyText && message.productId) bodyText = 'Sent a product attachment';
               if (!bodyText) bodyText = 'Sent a new message';

               // sender removed filter others participants
               const recipients = chat.participants
                    .filter((p: any) => p._id.toString() !== senderId)
                    .map((p: any) => p._id);

               if (recipients.length === 0) return;

               await this.sendToBatch(recipients, {
                    title: senderName,
                    body: bodyText.substring(0, 100),
                    type: 'message_new',
                    data: {
                         type: 'message_new',
                         chatId: chat._id.toString(),
                         messageId: message._id.toString(),
                         click_action: 'FLUTTER_NOTIFICATION_CLICK',
                    },
               });
          } catch (error) {
               logger.error(colors.red('❌ Error inside sendChatMessage:'), error);
          }
     }
     /**
      * 🔒 PRIVATE: Handle Firebase Logic & Token Cleanup
      */
     private static async sendToFCM(tokens: string[], payload: INotificationPayload) {
          try {
               // Firebase allows max 500 tokens per batch.
               // If you expect > 500, we should chunk this.
               // For now, assuming < 500 per batch call.

               const message = {
                    tokens: tokens,
                    notification: {
                         title: payload.title,
                         body: payload.body,
                    },
                    // Data values must be strings
                    data: payload.data || {},
               };

               const response = await admin.messaging().sendEachForMulticast(message);

               // Cleanup Invalid Tokens
               if (response.failureCount > 0) {
                    const failedTokens: string[] = [];
                    response.responses.forEach((resp, idx) => {
                         if (!resp.success) {
                              const errCode = resp.error?.code;
                              if (
                                   errCode === 'messaging/registration-token-not-registered' ||
                                   errCode === 'messaging/mismatched-credential'
                              ) {
                                   failedTokens.push(tokens[idx]);
                              }
                         }
                    });

                    if (failedTokens.length > 0) {
                         await DeviceToken.deleteMany({ fcmToken: { $in: failedTokens } });
                         logger.log(
                              colors.yellow(`🗑️ Cleaned up ${failedTokens.length} invalid tokens.`),
                         );
                    }
               }
          } catch (error) {
               logger.error(colors.red('FCM Send Error:'), error);
          }
     }

     /**
      * 🔒 PRIVATE: Handle Database Saving
      */
     private static async saveToDatabase(userIds: any[], payload: INotificationPayload) {
          try {
               const notifications = userIds.map((userId) => ({
                    userId: userId,
                    title: payload.title,
                    message: payload.body, // Mapping 'body' to 'message' based on your schema
                    type: payload.type,
                    data: payload.data, // Ensure your schema has a field for this, or remove it
                    isRead: false,
                    createdAt: new Date(),
               }));

               await Notification.insertMany(notifications);
          } catch (error) {
               logger.error(colors.red('DB Save Error:'), error);
          }
     }
}

export const notificationHelper = new NotificationHelper();
