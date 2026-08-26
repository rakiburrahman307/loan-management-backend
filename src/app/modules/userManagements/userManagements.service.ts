import { StatusCodes } from 'http-status-codes';
import { USER_ROLES } from '../../../enums/user';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { User } from '../user/user.model';
import { logger } from '../../../shared/logger';
import { EmailQueueHelper } from '../../../helpers/bullMQ/bullHelper';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';

const userCache = createCacheHelper('user');
const allUser = async (query: Record<string, unknown>) => {
     return await userCache.wrapList(
          query,
          async () => {
               const queryBuilder = new QueryBuilder(
                    User.find({ role: { $ne: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN] } }),
                    query,
               );

               const users = await queryBuilder
                    .search(['firstName', 'lastName', 'phone', 'email', 'address'])
                    .filter()
                    .sort()
                    .paginate()
                    .fields()
                    .modelQuery.exec();
               const meta = await queryBuilder.countTotal();
               return { users, meta };
          },
          CACHE_TTL.SHORT,
     );
};

// ✅ Wrap single item
const singleUser = async (id: string) => {
     return await userCache.wrapSingle(
          id,
          async () => {
               // Your EXACT SAME code
               const result = await User.findById(id);
               if (!result) {
                    throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
               }
               return result;
          },
          CACHE_TTL.MEDIUM,
     );
};

// ✅ Just add ONE line for cache clearing
const updateUserStatus = async (id: string, status: string) => {
     // Your EXACT SAME update code
     const result = await User.findByIdAndUpdate(id, { $set: { status } }, { new: true });

     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
     }

     // ✅ Just add this ONE line - clears all related caches
     await userCache.clearAfterUpdate(id);

     // Your EXACT SAME email logic
     if (status === 'blocked') {
          try {
               await EmailQueueHelper.blockAccountEmail(result.email, result.name);
               logger.info('Block account email sent successfully', { email: result.email });
          } catch (err: any) {
               logger.error('Failed to send block account email', {
                    error: err.message,
                    email: result.email,
               });
               throw new AppError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    'Failed to send block account email',
               );
          }
     }

     return result;
};

const restoreUser = async (id: string) => {
     // Explicitly set isDeleted: true to bypass the exclude-deleted middleware
     const user = await User.findOne({ _id: id, isDeleted: true });
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Deleted user not found.');
     }

     const suffixRegex = /_deleted_\d+$/;
     const originalEmail = user.email.replace(suffixRegex, '');

     // Check conflicts with active users
     const emailConflict = await User.findOne({ email: originalEmail });
     if (emailConflict) {
          throw new AppError(
               StatusCodes.CONFLICT,
               'Cannot restore user. An active user with this email already exists.',
          );
     }

     const updateData: Record<string, any> = {
          isDeleted: false,
          email: originalEmail,
     };

     if (user.googleId) {
          const originalGoogleId = user.googleId.replace(suffixRegex, '');
          const googleConflict = await User.findOne({ googleId: originalGoogleId });
          if (googleConflict) {
               throw new AppError(
                    StatusCodes.CONFLICT,
                    'Cannot restore user. An active user with this Google ID already exists.',
               );
          }
          updateData.googleId = originalGoogleId;
     }

     if (user.facebookId) {
          const originalFacebookId = user.facebookId.replace(suffixRegex, '');
          const facebookConflict = await User.findOne({ facebookId: originalFacebookId });
          if (facebookConflict) {
               throw new AppError(
                    StatusCodes.CONFLICT,
                    'Cannot restore user. An active user with this Facebook ID already exists.',
               );
          }
          updateData.facebookId = originalFacebookId;
     }

     const restoredUser = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true });

     await userCache.clearAfterUpdate(id);
     return restoredUser;
};

const getDeletedUsersFromDB = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(User.find({ isDeleted: true }), query);

     const users = await queryBuilder
          .search(['name', 'email'])
          .filter()
          .sort()
          .paginate()
          .fields()
          .modelQuery.exec();

     const meta = await queryBuilder.countTotal();

     const suffixRegex = /_deleted_\d+$/;
     const processedUsers = users.map((user) => {
          const userObj = user.toObject();
          if (userObj.email) {
               userObj.email = userObj.email.replace(suffixRegex, '');
          }
          if (userObj.googleId) {
               userObj.googleId = userObj.googleId.replace(suffixRegex, '');
          }
          if (userObj.facebookId) {
               userObj.facebookId = userObj.facebookId.replace(suffixRegex, '');
          }
          return userObj;
     });

     return {
          users: processedUsers,
          meta,
     };
};

export const DashboardUserService = {
     allUser,
     singleUser,
     updateUserStatus,
     restoreUser,
     getDeletedUsersFromDB,
};
