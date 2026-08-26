import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SessionService } from './session.service';

const getActiveSessions = catchAsync(async (req, res) => {
     const user = req.user;
     const result = await SessionService.getActiveSessionsFromDB(user.id);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Active sessions retrieved successfully.',
          data: result,
     });
});

const revokeSession = catchAsync(async (req, res) => {
     const user = req.user;
     const { id: sessionId } = req.params;
     const result = await SessionService.revokeSessionInDB(user.id, sessionId);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: result.message,
          data: {},
     });
});

const revokeOtherSessions = catchAsync(async (req, res) => {
     const user = req.user;
     const currentSessionId = user.sessionId;
     const result = await SessionService.revokeOtherSessionsInDB(user.id, currentSessionId || '');

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: result.message,
          data: {},
     });
});

export const SessionController = {
     getActiveSessions,
     revokeSession,
     revokeOtherSessions,
};
