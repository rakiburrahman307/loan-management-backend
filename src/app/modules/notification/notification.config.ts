import { NotificationReferenceModel, NotificationScreen, NotificationType } from './notification.interface';

export interface INotificationPreset {
     type: NotificationType;
     referenceModel: NotificationReferenceModel;
     screen: NotificationScreen;
}

export const NOTIFICATION_CONFIGS: Record<string, INotificationPreset> = {
     LOAN: {
          type: 'LOAN',
          referenceModel: 'Loan',
          screen: 'LOAN_DETAILS',
     },
     APPLICATION: {
          type: 'APPLICATION',
          referenceModel: 'LoanApplication',
          screen: 'APPLICATION_DETAILS',
     },
     REPAYMENT: {
          type: 'REPAYMENT',
          referenceModel: 'LoanRepayment',
          screen: 'LOAN_DETAILS',
     },
     PAYMENT: {
          type: 'PAYMENT',
          referenceModel: 'Payment',
          screen: 'PAYMENT_HISTORY',
     },
     PAYOUT: {
          type: 'PAYOUT',
          referenceModel: 'Loan',
          screen: 'PAYOUT_DETAILS',
     },
     SUPPORT: {
          type: 'SUPPORT',
          referenceModel: 'SupportTicket',
          screen: 'SUPPORT_DETAILS',
     },
     CHAT: {
          type: 'MESSAGE',
          referenceModel: 'SupportTicket',
          screen: 'CHAT',
     },
     ALERT: {
          type: 'ALERT',
          referenceModel: 'User',
          screen: 'DASHBOARD',
     },
     DASHBOARD: {
          type: 'SYSTEM',
          referenceModel: 'User',
          screen: 'DASHBOARD',
     },
     PROFILE: {
          type: 'SYSTEM',
          referenceModel: 'User',
          screen: 'PROFILE',
     },
};
