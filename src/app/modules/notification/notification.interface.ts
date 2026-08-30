import { Types } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';

export type NotificationType =
     | 'ADMIN'
     | 'SYSTEM'
     | 'PAYMENT'
     | 'REPAYMENT'
     | 'PAYOUT'
     | 'LOAN'
     | 'APPLICATION'
     | 'MESSAGE'
     | 'SUPPORT'
     | 'ALERT';

export type NotificationScreen =
     | 'DASHBOARD'
     | 'LOAN_DETAILS'
     | 'APPLICATION_DETAILS'
     | 'CHAT'
     | 'PAYMENT_HISTORY'
     | 'PAYOUT_DETAILS'
     | 'SUPPORT_DETAILS'
     | 'PROFILE';

export type NotificationReferenceModel =
     | 'User'
     | 'Borrower'
     | 'Loan'
     | 'LoanApplication'
     | 'Payment'
     | 'LoanRepayment'
     | 'SupportTicket';

export interface INotification {
     title?: string;
     message: string;
     receiver: Types.ObjectId;
     reference?: Types.ObjectId | string;
     referenceModel?: NotificationReferenceModel;
     screen?: NotificationScreen;
     read: boolean;
     type?: NotificationType;
     receiverRole?: USER_ROLES;
     additionalData?: Record<string, any>;
}
