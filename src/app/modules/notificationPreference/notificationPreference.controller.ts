import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { NotificationPreferenceService } from './notificationPreference.service';

// get user preferences
const getUserPreference = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await NotificationPreferenceService.getUserPreference(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'User Preferences Retrieved Successfully',
          data: result,
     });
});

// update user preferences
const updateUserPreference = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await NotificationPreferenceService.updateUserPreference(id, req.body);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'User Preferences Updated Successfully',
          data: result,
     });
});

export const NotificationPreferenceController = {
     getUserPreference,
     updateUserPreference,
};
