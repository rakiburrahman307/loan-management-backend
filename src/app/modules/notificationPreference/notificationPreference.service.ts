import { NotificationPreference } from './notificationPreference.model';

// get user preferences
const getUserPreference = async (userId: string): Promise<any> => {
     const result = await NotificationPreference.findOne({ userId });
     if (!result) {
          return {};
     }
     return result;
};

// update user preferences
const updateUserPreference = async (userId: string, preferences: any): Promise<any> => {
     const idExists = await NotificationPreference.exists({ userId });
     if (!idExists) {
          await NotificationPreference.create({ userId, ...preferences });
     }
     const result = await NotificationPreference.findOneAndUpdate({ userId }, preferences, {
          new: true,
          upsert: true,
     });
     return result;
};
export const NotificationPreferenceService = {
     getUserPreference,
     updateUserPreference,
};
