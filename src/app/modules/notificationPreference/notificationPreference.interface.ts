import { Types } from 'mongoose';
export interface INotificationPreference {
     userId: Types.ObjectId;
     sms: boolean;
     push: boolean;
     email: boolean;
}
