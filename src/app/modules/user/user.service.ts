import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import { IUser } from './user.interface';
import { User } from './user.model';
import AppError from '../../../errors/AppError';
import generateOTP from '../../../utils/generateOTP';
import { EmailQueueHelper } from '../../../helpers/bullMQ/bullHelper';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
import config from '../../../config';
import { otpEncode } from '../../../utils/cryptoUtils';

const userCache = createCacheHelper('user');

// create user
const createUserToDB = async (payload: IUser): Promise<IUser> => {
     //set role
     const user = await User.isExistUserByEmail(payload.email);
     if (user) {
          throw new AppError(StatusCodes.CONFLICT, 'Email already exists');
     }
     payload.role = USER_ROLES.USER;
     const createUser = await User.create(payload);
     if (!createUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create user');
     }
     //send email
     const otp = generateOTP(config.otp.length);
     await EmailQueueHelper.sendWelcomeEmail(createUser.email!, createUser.name, otp);

     //save to DB
     const authentication = {
          otpRequestedAt: new Date(),
          oneTimeCode: otpEncode(otp, createUser?.email!),
          expireAt: new Date(Date.now() + config.otp.expire_time),
     };
     await User.findOneAndUpdate({ _id: createUser._id }, { $set: { authentication } });
     await userCache.clearLists();
     return createUser;
};

// create Admin
const createAdminToDB = async (payload: Partial<IUser>): Promise<IUser> => {
     //set role
     payload.role = USER_ROLES.ADMIN;
     const createAdmin = await User.create(payload);
     if (!createAdmin) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create admin');
     }

     //send email
     const otp = generateOTP(config.otp.length);
     const values = {
          name: createAdmin.name,
          otp: otp,
          email: createAdmin.email!,
     };
     const createAccountTemplate = emailTemplate.createAccount(values);
     emailHelper.sendEmail(createAccountTemplate);

     //save to DB
     const authentication = {
          oneTimeCode: otp,
          expireAt: new Date(Date.now() + config.otp.expire_time),
     };
     await User.findOneAndUpdate({ _id: createAdmin._id }, { $set: { authentication } });
     await userCache.clearLists();
     return createAdmin;
};

// get user profile
const getUserProfileFromDB = async (user: JwtPayload): Promise<Partial<IUser>> => {
     return await userCache.wrapSingle(
          user.id,
          async () => {
               const { id } = user;
               const isExistUser = await User.isExistUserById(id);
               if (!isExistUser) {
                    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
               }
               return isExistUser;
          },
          CACHE_TTL.MEDIUM,
     );
};

// update user profile
const updateProfileToDB = async (
     user: JwtPayload,
     payload: Partial<IUser>,
): Promise<Partial<IUser | null>> => {
     const { id } = user;
     const isExistUser = await User.isExistUserById(id);
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     //unlink file here
     if (payload.image && isExistUser.image) {
          unlinkFile(isExistUser.image);
     }

     const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
          new: true,
     });
     await userCache.clearAfterUpdate(id);
     return updateDoc;
};

const verifyUserPassword = async (userId: string, password: string) => {
     const user = await User.findById(userId).select('+password');
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
     }
     const isPasswordValid = await User.isMatchPassword(password, user.password || '');
     return isPasswordValid;
};

const deleteUser = async (id: string) => {
     const isExistUser = await User.findById(id);
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     const suffix = `_deleted_${Date.now()}`;
     const newEmail = `${isExistUser.email}${suffix}`;

     const updateData: Record<string, any> = {
          isDeleted: true,
          email: newEmail,
     };

     if (isExistUser.googleId) {
          updateData.googleId = `${isExistUser.googleId}${suffix}`;
     }
     if (isExistUser.facebookId) {
          updateData.facebookId = `${isExistUser.facebookId}${suffix}`;
     }

     await User.findByIdAndUpdate(id, {
          $set: updateData,
     });
     await userCache.clearAfterUpdate(id);
     return true;
};

export const UserService = {
     createUserToDB,
     getUserProfileFromDB,
     updateProfileToDB,
     createAdminToDB,
     deleteUser,
     verifyUserPassword,
};
