import { JwtPayload } from 'jsonwebtoken';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';
import AppError from '../../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { sendNotifications } from '../../../helpers/notificationsHelper';

// get notifications
const getNotificationFromDB = async (user: JwtPayload): Promise<INotification> => {
     const result = await Notification.find({ receiver: user.id }).populate({
          path: 'sender',
          select: 'name profile',
     });

     const unreadCount = await Notification.countDocuments({
          receiver: user.id,
          read: false,
     });

     const data: any = {
          result,
          unreadCount,
     };

     return data;
};

// read notifications only for user
const readNotificationToDB = async (user: JwtPayload): Promise<INotification | undefined> => {
     const result: any = await Notification.updateMany(
          { receiver: user.id, read: false },
          { $set: { read: true } },
     );
     return result;
};

// get notifications for admin
const adminNotificationFromDB = async () => {
     const result = await Notification.find({ type: 'ADMIN' });
     return result;
};

// read notifications only for admin
const adminReadNotificationToDB = async (): Promise<INotification | null> => {
     const result: any = await Notification.updateMany(
          { type: 'ADMIN', read: false },
          { $set: { read: true } },
          { new: true },
     );
     return result;
};
const adminSendNotificationFromDB = async (payload: any) => {
     const { title, message, receiver } = payload;

     // Validate input
     if (!title || !message) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Title and message are required');
     }
     const notificationData = {
          title,
          referenceModel: 'MESSAGE',
          text: message,
          type: 'ADMIN',
          receiver: receiver || null,
     };

     const result = await sendNotifications(notificationData);
};
export const NotificationService = {
     adminNotificationFromDB,
     getNotificationFromDB,
     readNotificationToDB,
     adminReadNotificationToDB,
     adminSendNotificationFromDB,
};
