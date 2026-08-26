import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { FcmTokenService } from './fcmToken.service';

const saveDeviceToken = catchAsync(async (req, res) => {
     const { id: userId } = req.user as { id: string };
     const payload = req.body;
     const result = await FcmTokenService.saveDeviceToken(userId, payload);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Device token saved successfully',
          data: result,
     });
});

const deleteDeviceToken = catchAsync(async (req, res) => {
     const { id: userId } = req.user as { id: string };
     const payload = req.body;
     const result = await FcmTokenService.deleteDeviceToken(userId, payload);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Device token deleted successfully',
          data: result,
     });
});

export const FcmTokenController = {
     saveDeviceToken,
     deleteDeviceToken,
};
