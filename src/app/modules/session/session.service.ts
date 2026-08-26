import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { Session } from './session.model';

const getActiveSessionsFromDB = async (userId: string) => {
     return await Session.find({ user: userId, isRevoked: false })
          .select('-user -userAgent -createdAt -updatedAt -__v')
          .sort({ lastActive: -1 });
};

const revokeSessionInDB = async (userId: string, sessionId: string) => {
     const session = await Session.findOne({ _id: sessionId, user: userId });
     if (!session) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Session not found');
     }

     session.isRevoked = true;
     await session.save();

     return { message: 'Device logged out successfully' };
};

const revokeOtherSessionsInDB = async (userId: string, currentSessionId: string) => {
     await Session.updateMany(
          {
               user: userId,
               _id: { $ne: currentSessionId },
               isRevoked: false,
          },
          {
               $set: { isRevoked: true },
          },
     );

     return { message: 'All other devices logged out successfully' };
};

export const SessionService = {
     getActiveSessionsFromDB,
     revokeSessionInDB,
     revokeOtherSessionsInDB,
};
