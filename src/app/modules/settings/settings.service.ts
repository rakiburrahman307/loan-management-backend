import path from 'path';
import { ISettings } from './settings.interface';
import Settings from './settings.model';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
const upsertSettings = async (data: Partial<ISettings>): Promise<ISettings> => {
     const updatedSettings = await Settings.findOneAndUpdate({}, data, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
     });

     // Delete any older duplicate settings records to ensure only one exists
     await Settings.deleteMany({ _id: { $ne: updatedSettings._id } });

     return updatedSettings;
};
const getSettings = async (key: string) => {
     const settings = await Settings.findOne();

     if (key) {
          const value =
               settings?.toObject() &&
               Object.prototype.hasOwnProperty.call(settings.toObject(), key)
                    ? settings.get(key)
                    : '';

          return {
               [key]: value,
          };
     }

     return settings || {};
};

// const getPrivacyPolicy = async () => {
//   return path.join(__dirname, '..', 'htmlResponse', 'privacyPolicy.html');
// };

const getAccountDelete = async () => {
     return path.join(__dirname, '..', 'htmlResponse', 'accountDelete.html');
};

// const getSupport = async () => {
//   return path.join(__dirname, '..', 'htmlResponse', 'support.html');
// };
export const settingsService = {
     upsertSettings,
     getSettings,
     getAccountDelete,
};
