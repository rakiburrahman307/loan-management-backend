import { model, Schema } from 'mongoose';
import { INotificationPreference } from './notificationPreference.interface';

const notificationPreferenceSchema = new Schema<INotificationPreference>(
     {
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
          },
          sms: {
               type: Boolean,
               default: false,
          },
          push: {
               type: Boolean,
               default: false,
          },
          email: {
               type: Boolean,
               default: false,
          },
     },
     {
          timestamps: true,
     },
);

export const NotificationPreference = model<INotificationPreference>(
     'NotificationPreference',
     notificationPreferenceSchema,
);
