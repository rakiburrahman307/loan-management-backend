import mongoose from 'mongoose';
import colors from 'colors';
import { DeviceToken } from './fcmToken.model';
import { ITokenData } from './fcmToken.interface';
import { logger } from '../../../shared/logger';

const saveDeviceToken = async (userId: string | mongoose.Types.ObjectId, payload: ITokenData) => {
     try {
          const result = await DeviceToken.findOneAndUpdate(
               {
                    fcmToken: payload.fcmToken,
               },
               {
                    $set: {
                         userId,
                         deviceId: payload.deviceId,
                         deviceType: payload.deviceType,
                    },
               },
               {
                    upsert: true,
                    new: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
               },
          );

          logger.info(
               colors.green(`✅ Device token saved. User: ${userId}, Device: ${payload.deviceId}`),
          );

          return result;
     } catch (error: any) {
          logger.error(colors.red('❌ Error saving device token:'), error);
          throw error;
     }
};

const deleteDeviceToken = async (userId: string | mongoose.Types.ObjectId, payload: ITokenData) => {
     try {
          const result = await DeviceToken.deleteMany({
               userId,
               deviceId: payload.deviceId,
               deviceType: payload.deviceType,
          });
          logger.info(
               colors.green(
                    `✅ Device token deleted. User: ${userId}, Device: ${payload.deviceId}`,
               ),
          );
          return result;
     } catch (error: any) {
          logger.error(colors.red('❌ Error deleting device token:'), error);
          throw error;
     }
};

export const FcmTokenService = {
     saveDeviceToken,
     deleteDeviceToken,
};
