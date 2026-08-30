import { model, Schema } from 'mongoose';
import { INotification } from './notification.interface';
import { USER_ROLES } from '../../../enums/user';

export enum NotificationType {
     ADMIN = 'ADMIN',
     SYSTEM = 'SYSTEM',
     PAYMENT = 'PAYMENT',
     REPAYMENT = 'REPAYMENT',
     PAYOUT = 'PAYOUT',
     LOAN = 'LOAN',
     APPLICATION = 'APPLICATION',
     MESSAGE = 'MESSAGE',
     SUPPORT = 'SUPPORT',
     ALERT = 'ALERT',
}

export enum NotificationScreen {
     DASHBOARD = 'DASHBOARD',
     LOAN_DETAILS = 'LOAN_DETAILS',
     APPLICATION_DETAILS = 'APPLICATION_DETAILS',
     CHAT = 'CHAT',
     PAYMENT_HISTORY = 'PAYMENT_HISTORY',
     PAYOUT_DETAILS = 'PAYOUT_DETAILS',
     SUPPORT_DETAILS = 'SUPPORT_DETAILS',
     PROFILE = 'PROFILE',
}

const notificationSchema = new Schema<INotification>(
     {
          title: {
               type: String,
               required: false,
          },
          message: {
               type: String,
               required: true,
          },
          receiver: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: false,
               index: true,
          },
          reference: {
               type: Schema.Types.ObjectId,
               refPath: 'referenceModel',
               required: false,
          },
          referenceModel: {
               type: String,
               enum: [
                    'User',
                    'Borrower',
                    'Loan',
                    'LoanApplication',
                    'Payment',
                    'LoanRepayment',
                    'SupportTicket',
               ],
               required: false,
          },
          screen: {
               type: String,
               enum: Object.values(NotificationScreen),
               required: false,
          },
          read: {
               type: Boolean,
               default: false,
               index: true,
          },
          type: {
               type: String,
               enum: Object.values(NotificationType),
               required: false,
          },
          receiverRole: {
               type: String,
               enum: Object.values(USER_ROLES),
               required: false,
               index: true,
          },
          additionalData: {
               type: Schema.Types.Mixed,
               required: false,
          },
     },
     {
          timestamps: true,
     },
);

notificationSchema.index({ receiver: 1, read: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);
