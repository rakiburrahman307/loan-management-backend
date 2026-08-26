import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { IAuthResetPassword, IChangePassword, ILoginData, IVerifyEmail } from '../../../types/auth';
import { ResetToken } from '../resetToken/resetToken.model';
import { User } from '../user/user.model';
import AppError from '../../../errors/AppError';
import generateOTP from '../../../utils/generateOTP';
import cryptoToken from '../../../utils/cryptoToken';
import { verifyToken } from '../../../utils/verifyToken';
import { EmailQueueHelper } from '../../../helpers/bullMQ/bullHelper';
import { FcmTokenService } from '../fcmToken/fcmToken.service';
import { otpEncode, otpVerify } from '../../../utils/cryptoUtils';
import { Session } from '../session/session.model';
import { parseUserAgent } from '../../../utils/userAgentParser';

//login
const loginUserFromDB = async (payload: ILoginData, ip?: string, userAgent?: string) => {
     const { email, password } = payload;

     const isExistUser = await User.findOne({ email }).select('+password');
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     // Handle OAuth users (they don't have passwords)
     if (isExistUser.oauthProvider) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               `This account was created using ${isExistUser.oauthProvider}. Please use the ${isExistUser.oauthProvider} login option.`,
          );
     }

     if (!password) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Password is required!');
     }

     // Check if user is blocked
     if (
          isExistUser?.authentication?.blockedUntil &&
          isExistUser?.authentication?.blockedUntil > new Date()
     ) {
          const remainingTime = Math.ceil(
               (isExistUser.authentication.blockedUntil.getTime() - new Date().getTime()) / 1000,
          );
          throw new AppError(
               StatusCodes.FORBIDDEN,
               `Your account is temporarily blocked. Please try again in ${remainingTime} seconds.`,
          );
     }

     // Check verified and status
     if (!isExistUser.isVerified) {
          const otp = generateOTP(config.otp.length);
          await EmailQueueHelper.sendWelcomeEmail(isExistUser.email!, isExistUser.name, otp);

          const authentication = {
               oneTimeCode: otpEncode(otp, isExistUser.email),
               expireAt: new Date(Date.now() + config.otp.expire_time),
          };
          await User.findOneAndUpdate({ email }, { $set: { authentication } });

          throw new AppError(
               StatusCodes.CONFLICT,
               'Please verify your account, then try to login again',
          );
     }

     if (payload.fcmToken && payload.deviceId) {
          await FcmTokenService.saveDeviceToken(isExistUser._id.toString(), {
               fcmToken: payload.fcmToken,
               deviceId: payload.deviceId,
               deviceType: payload.deviceType || 'android',
          });
     }

     // Check user status
     if (isExistUser?.status === 'blocked') {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               'You do not have permission to access this content. It looks like your account has been blocked.',
          );
     }

     // Check match password
     const isPasswordMatch = await User.isMatchPassword(password, isExistUser.password || '');
     if (!isPasswordMatch) {
          // Increment loginAttempts and check if the user should be blocked
          const loginAttempts = isExistUser?.authentication?.loginAttempts || 0;

          if (loginAttempts >= 3) {
               // Block the user for 5 minutes
               const blockedUntil = new Date();
               blockedUntil.setMinutes(blockedUntil.getMinutes() + 5);

               await User.findOneAndUpdate(
                    { email },
                    {
                         $set: {
                              'authentication.loginAttempts': loginAttempts,
                              'authentication.blockedUntil': blockedUntil,
                         },
                    },
               );
               throw new AppError(
                    StatusCodes.FORBIDDEN,
                    'You have reached the maximum number of login attempts. Please try again after 5 minutes.',
               );
          }

          // Update loginAttempts
          await User.findOneAndUpdate(
               { email },
               {
                    $set: { 'authentication.loginAttempts': loginAttempts },
               },
          );

          throw new AppError(StatusCodes.BAD_REQUEST, 'Password is incorrect!');
     }

     // Reset loginAttempts on successful login
     await User.findOneAndUpdate(
          { email },
          {
               $set: { 'authentication.loginAttempts': 0, 'authentication.blockedUntil': null },
          },
     );

     // Parse device & browser details from raw User-Agent
     const parsedUA = parseUserAgent(userAgent || '');

     // Create device login session in database
     const session = await Session.create({
          user: isExistUser._id,
          userAgent: userAgent || '',
          ip: ip || '',
          browser: parsedUA.browser,
          os: parsedUA.os,
          device: parsedUA.device,
          expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Session expiration (30 days)
     });

     const jwtData = {
          id: isExistUser._id,
          role: isExistUser.role,
          email: isExistUser.email,
          sessionId: session._id.toString(),
     };
     const accessToken = jwtHelper.createToken(
          jwtData,
          config.jwt.jwt_secret as Secret,
          config.jwt.jwt_expire_in as string,
     );
     const refreshToken = jwtHelper.createToken(
          jwtData,
          config.jwt.jwt_refresh_secret as Secret,
          config.jwt.jwt_refresh_expire_in as string,
     );

     return { accessToken, refreshToken };
};

//forget password
const forgetPasswordToDB = async (email: string) => {
     const isExistUser = await User.isExistUserByEmail(email);
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     //send mail
     const otp = generateOTP(config.otp.length);
     await EmailQueueHelper.sendPasswordResetEmail(isExistUser.email!, otp);

     //save to DB
     const authentication = {
          purpose: 'resetPassword',
          isResetPassword: true,
          oneTimeCode: otpEncode(otp, email),
          expireAt: new Date(Date.now() + config.otp.expire_time),
     };
     await User.findOneAndUpdate({ email }, { $set: { authentication } });
};
// resend otp
const resendOtpFromDb = async (email: string) => {
     // Check if the user exists
     const isExistUser = await User.isExistUserByEmail(email);
     if (!isExistUser || !isExistUser._id) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     // send email
     const otp = generateOTP(config.otp.length);
     const otpCoolDown = config.otp.expire_time;

     if (isExistUser.authentication.otpRequestedAt) {
          const lastRequested = new Date(isExistUser.authentication.otpRequestedAt).getTime();
          const currentTime = new Date().getTime();

          if (currentTime - lastRequested < otpCoolDown) {
               const remainingTime = ((lastRequested + otpCoolDown - currentTime) / 1000).toFixed(
                    0,
               );
               throw new Error(
                    `Please wait ${remainingTime} seconds before requesting another OTP.`,
               );
          }
     }
     await EmailQueueHelper.sendWelcomeEmail(isExistUser.email!, isExistUser.name, otp);

     //save to DB
     const authentication = {
          oneTimeCode: otpEncode(otp, email),
          expireAt: new Date(Date.now() + config.otp.expire_time),
     };
     await User.findOneAndUpdate({ _id: isExistUser._id }, { $set: { authentication } });
};

//verify email
const verifyEmailToDB = async (payload: IVerifyEmail, ip?: string, userAgent?: string) => {
     const { email, oneTimeCode } = payload;

     // Check if user exists
     const isExistUser = await User.findOne({ email }).select('+authentication');
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     // Ensure OTP is provided
     if (!oneTimeCode) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               'Please provide the OTP, check your email for the code',
          );
     }

     // Check if the OTP is correct
     if (!otpVerify(oneTimeCode.toString(), email, isExistUser.authentication?.oneTimeCode || '')) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'You provided the wrong OTP');
     }

     // Check if OTP has expired
     const date = new Date();
     if (isExistUser?.authentication?.expireAt && date > isExistUser.authentication.expireAt) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'OTP already expired, please try again');
     }

     let message;
     let verifyToken;
     let accessToken;
     let user;

     let refreshToken;

     // Case 1: If the user is not verified, verify the email
     if (!isExistUser.isVerified) {
          await User.findOneAndUpdate(
               { _id: isExistUser._id },
               {
                    'authentication.purpose': null,
                    'verified': true,
                    'authentication.oneTimeCode': null,
                    'authentication.expireAt': null,
               },
          );

          // Parse device and browser info from raw User-Agent
          const parsedUA = parseUserAgent(userAgent || '');

          // Create login session in DB upon verification success
          const session = await Session.create({
               user: isExistUser._id,
               userAgent: userAgent || '',
               ip: ip || '',
               browser: parsedUA.browser,
               os: parsedUA.os,
               device: parsedUA.device,
               expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Session expiration (30 days)
          });

          const jwtPayload = {
               id: isExistUser._id,
               role: isExistUser.role,
               email: isExistUser.email,
               sessionId: session._id.toString(),
          };

          // Create access token after email verification
          accessToken = jwtHelper.createToken(
               jwtPayload,
               config.jwt.jwt_secret as Secret,
               config.jwt.jwt_expire_in as string,
          );

          // Create refresh token after email verification
          refreshToken = jwtHelper.createToken(
               jwtPayload,
               config.jwt.jwt_refresh_secret as Secret,
               config.jwt.jwt_refresh_expire_in as string,
          );

          message = 'Email verified successfully';
          user = await User.findById(isExistUser._id);
     } else {
          // Case 2: If user is already verified, generate reset token
          await User.findOneAndUpdate(
               { _id: isExistUser._id },
               {
                    'authentication.purpose': 'resetPassword',
                    'authentication.isResetPassword': true,
                    'authentication.oneTimeCode': null,
                    'authentication.expireAt': null,
               },
          );

          // Generate reset token for password reset
          const createToken = cryptoToken(); // Ensure `cryptoToken()` is implemented securely
          await ResetToken.create({
               user: isExistUser._id,
               token: createToken,
               expireAt: new Date(Date.now() + 5 * 60000), // Set expiration to 5 minutes
          });

          message =
               'Verification successful: Please securely store and use this code for password reset';
          verifyToken = createToken;
     }

     // Return tokens and messages
     return { verifyToken, message, accessToken, refreshToken, user };
};

//reset password
const resetPasswordToDB = async (token: string, payload: IAuthResetPassword) => {
     const { newPassword, confirmPassword } = payload;
     //isExist token
     const isExistToken = await ResetToken.isExistToken(token);
     if (!isExistToken) {
          throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
     }

     //user permission check
     const isExistUser = await User.findById(isExistToken.user).select('+authentication');
     if (
          !isExistUser?.authentication?.isResetPassword &&
          isExistUser?.authentication?.purpose === 'resetPassword'
     ) {
          throw new AppError(
               StatusCodes.UNAUTHORIZED,
               "You don't have permission to change the password. Please click again to 'Forgot Password'",
          );
     }

     //validity check
     const isValid = await ResetToken.isExpireToken(token);
     if (!isValid) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               'Token expired, Please click again to the forget password',
          );
     }

     //check password
     if (newPassword !== confirmPassword) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               "New password and Confirm password doesn't match!",
          );
     }

     const hashPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

     const updateData = {
          'password': hashPassword,
          'authentication.purpose': null,
          'authentication.isResetPassword': false,
     };

     await User.findOneAndUpdate({ _id: isExistToken.user }, { $set: updateData }, { new: true });
};

const changePasswordToDB = async (user: JwtPayload, payload: IChangePassword) => {
     const { currentPassword, newPassword, confirmPassword } = payload;
     const isExistUser = await User.findById(user.id).select('+password');
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     //current password match
     if (
          currentPassword &&
          !(await User.isMatchPassword(currentPassword, isExistUser.password || ''))
     ) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Password is incorrect');
     }

     //newPassword and current password
     if (currentPassword === newPassword) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               'Please give different password from current password',
          );
     }
     //new password and confirm password check
     if (newPassword !== confirmPassword) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               "Password and Confirm password doesn't matched",
          );
     }

     //hash password
     const hashPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

     const updateData = { password: hashPassword };
     const result = await User.findOneAndUpdate({ _id: user.id }, updateData, { new: true });
     return result;
};
// Refresh token
const refreshToken = async (token: string) => {
     if (!token) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Token not found');
     }

     const decoded = verifyToken(token, config.jwt.jwt_refresh_secret as Secret);

     const { id, sessionId } = decoded;

     const activeUser = await User.findById(id);
     if (!activeUser) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }

     if (activeUser.status !== 'active') {
          throw new AppError(StatusCodes.FORBIDDEN, 'User account is inactive');
     }
     if (!activeUser.isVerified) {
          throw new AppError(StatusCodes.FORBIDDEN, 'User account is not verified');
     }
     if (activeUser.isDeleted) {
          throw new AppError(StatusCodes.FORBIDDEN, 'User account is deleted');
     }

     // Validate active session
     if (sessionId) {
          const session = await Session.findOne({ _id: sessionId, isRevoked: false });
          if (!session) {
               throw new AppError(StatusCodes.UNAUTHORIZED, 'Session has been revoked or expired');
          }
          // Update lastActive timestamp on session
          await Session.findByIdAndUpdate(sessionId, { $set: { lastActive: new Date() } });
     }

     const jwtPayload = {
          id: activeUser?._id?.toString() as string,
          role: activeUser?.role,
          email: activeUser.email,
          sessionId: sessionId,
     };

     const accessToken = jwtHelper.createToken(
          jwtPayload,
          config.jwt.jwt_secret as Secret,
          config.jwt.jwt_expire_in as string,
     );

     return { accessToken };
};
const logoutUserFromDB = async (
     user: { id: string; sessionId?: string },
     payload?: { deviceId?: string; deviceType?: 'ios' | 'android' | 'web' },
) => {
     if (user.sessionId) {
          await Session.findOneAndUpdate(
               { _id: user.sessionId, user: user.id },
               { $set: { isRevoked: true } },
          );
     }

     if (payload?.deviceId && payload?.deviceType) {
          await FcmTokenService.deleteDeviceToken(user.id, {
               deviceId: payload.deviceId,
               deviceType: payload.deviceType,
               fcmToken: '',
          });
     }
};
export const AuthService = {
     verifyEmailToDB,
     loginUserFromDB,
     forgetPasswordToDB,
     resetPasswordToDB,
     changePasswordToDB,
     resendOtpFromDb,
     refreshToken,
     logoutUserFromDB,
};
