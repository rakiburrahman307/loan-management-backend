import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.service';

const getNotificationFromDB = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await NotificationService.getNotificationFromDB(id, req.query);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notifications Retrieved Successfully',
          data: { result: result.data, unreadCount: result.unreadCount },
          meta: result.meta,
     });
});

const readAllNotification = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await NotificationService.readAllNotificationToDB(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notification Read Successfully',
          data: result,
     });
});
const readNotification = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await NotificationService.readNotificationToDB(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notification Read Successfully',
          data: result,
     });
});

const deleteNotification = catchAsync(async (req, res) => {
     const { id } = req.params;
     const { id: userId, role } = req.user as { id: string; role: string };
     const result = await NotificationService.deleteNotificationFromDB(id, userId, role);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notification Deleted Successfully',
          data: result,
     });
});

const deleteAllNotifications = catchAsync(async (req, res) => {
     const { id: userId } = req.user as { id: string };
     const result = await NotificationService.deleteAllNotificationsFromDB(userId);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'All Notifications Deleted Successfully',
          data: result,
     });
});

export const NotificationController = {
     getNotificationFromDB,
     readAllNotification,
     readNotification,
     deleteNotification,
     deleteAllNotifications,
};
