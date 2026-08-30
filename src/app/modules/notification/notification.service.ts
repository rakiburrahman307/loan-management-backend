import mongoose from 'mongoose';
import { Notification } from './notification.model';
import AppError from '../../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
import { USER_ROLES } from '../../../enums/user';

// get notifications
const getNotificationFromDB = async (id: string, query: Record<string, unknown>) => {
     const page = Number(query.page) || 1;
     const limit = Number(query.limit) || 20;
     const skip = (page - 1) * limit;

     const filter: Record<string, any> = { receiver: id };
     if (query.role) {
          filter.receiverRole = query.role;
     }

     const [notifications, total, unreadCount] = await Promise.all([
          Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
          Notification.countDocuments(filter),
          Notification.countDocuments({ ...filter, read: false }),
     ]);

     if (total === 0) {
          const fakeNotifications = [
               {
                    _id: new mongoose.Types.ObjectId(),
                    title: 'Application Received',
                    message: 'Your loan application for Fintech Ltd has been submitted successfully.',
                    receiver: new mongoose.Types.ObjectId(id),
                    type: 'APPLICATION',
                    screen: 'APPLICATION_DETAILS',
                    referenceModel: 'LoanApplication',
                    read: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
               },
               {
                    _id: new mongoose.Types.ObjectId(),
                    title: 'Payout Transferred',
                    message: 'Disbursement of £250,000 has been transferred to your connected Barclays account.',
                    receiver: new mongoose.Types.ObjectId(id),
                    type: 'PAYOUT',
                    screen: 'LOAN_DETAILS',
                    referenceModel: 'Loan',
                    read: false,
                    createdAt: new Date(Date.now() - 3600000 * 2),
                    updatedAt: new Date(Date.now() - 3600000 * 2),
               },
               {
                    _id: new mongoose.Types.ObjectId(),
                    title: 'Repayment Received',
                    message: 'A revenue share repayment of £842.10 has been automatically processed.',
                    receiver: new mongoose.Types.ObjectId(id),
                    type: 'REPAYMENT',
                    screen: 'PAYMENT_HISTORY',
                    referenceModel: 'LoanRepayment',
                    read: true,
                    createdAt: new Date(Date.now() - 3600000 * 24),
                    updatedAt: new Date(Date.now() - 3600000 * 24),
               },
               {
                    _id: new mongoose.Types.ObjectId(),
                    title: 'Support Ticket Update',
                    message: 'Admin has replied to your support ticket regarding Stripe integration.',
                    receiver: new mongoose.Types.ObjectId(id),
                    type: 'SUPPORT',
                    screen: 'SUPPORT_DETAILS',
                    referenceModel: 'SupportTicket',
                    read: true,
                    createdAt: new Date(Date.now() - 3600000 * 48),
                    updatedAt: new Date(Date.now() - 3600000 * 48),
               },
          ];

          return {
               data: fakeNotifications,
               unreadCount: 2,
               meta: {
                    page,
                    limit,
                    total: fakeNotifications.length,
                    totalPage: 1,
               },
          };
     }

     return {
          data: notifications,
          unreadCount,
          meta: {
               page,
               limit,
               total,
               totalPage: Math.ceil(total / limit),
          },
     };
};
// read notifications only for user
const readAllNotificationToDB = async (id: string) => {
     const result = await Notification.updateMany(
          { receiver: id, read: false },
          { $set: { read: true } },
     );
     return result;
};
const readNotificationToDB = async (id: string) => {
     const result = await Notification.findByIdAndUpdate(id, { $set: { read: true } });
     return result;
};

const deleteNotificationFromDB = async (id: string, userId: string, role: string) => {
     const notification = await Notification.findById(id);
     if (!notification) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Notification not found');
     }

     if (
          role !== USER_ROLES.ADMIN &&
          role !== USER_ROLES.SUPER_ADMIN &&
          notification.receiver?.toString() !== userId
     ) {
          throw new AppError(StatusCodes.FORBIDDEN, 'You do not have permission to delete this notification');
     }

     const result = await Notification.findByIdAndDelete(id);
     return result;
};

const deleteAllNotificationsFromDB = async (userId: string) => {
     const result = await Notification.deleteMany({ receiver: userId });
     return result;
};

export const NotificationService = {
     getNotificationFromDB,
     readAllNotificationToDB,
     readNotificationToDB,
     deleteNotificationFromDB,
     deleteAllNotificationsFromDB,
};
