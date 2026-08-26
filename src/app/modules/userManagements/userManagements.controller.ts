import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { DashboardUserService } from './userManagements.service';

const getAllUser = catchAsync(async (req, res) => {
     const result = await DashboardUserService.allUser(req.query);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'User retrieved successfully',
          data: result.users,
          meta: result.meta,
     });
});

const getSingleUser = catchAsync(async (req, res) => {
     const result = await DashboardUserService.singleUser(req.params.id);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'User retrieved successful',
          data: result,
     });
});

const updateStatus = catchAsync(async (req, res) => {
     const { status } = req.body;
     const result = await DashboardUserService.updateUserStatus(req.params.id, status);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'User status update successfully',
          data: result,
     });
});

const restoreUser = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await DashboardUserService.restoreUser(id);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User restored successfully.',
          data: result,
     });
});

const getDeletedUsers = catchAsync(async (req, res) => {
     const result = await DashboardUserService.getDeletedUsersFromDB(req.query);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Deleted users retrieved successfully',
          data: result.users,
          meta: result.meta,
     });
});

export const DashboardUserController = {
     getAllUser,
     getSingleUser,
     updateStatus,
     restoreUser,
     getDeletedUsers,
};
