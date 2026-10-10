import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';
import config from '../../../config';
import { CookieOptions } from 'express';

const verifyEmail = catchAsync(async (req, res) => {
     const { ...verifyData } = req.body;
     const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
     const userAgent = req.headers['user-agent'] || '';
     const result = await AuthService.verifyEmailToDB(verifyData, ip, userAgent);

     const cookieOptions: CookieOptions = { secure: false, httpOnly: true, maxAge: 31536000000 };

     if (config.node_env === 'production') {
          cookieOptions.secure = true;
          cookieOptions.sameSite = 'none';
     }

     if (result.refreshToken) {
          res.cookie('refreshToken', result.refreshToken, cookieOptions);
     }

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: result.message,
          data: {
               verifyToken: result.verifyToken,
               accessToken: result.accessToken,
               refreshToken: result.refreshToken,
          },
     });
});

const loginUser = catchAsync(async (req, res) => {
     const { ...loginData } = req.body;
     const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
     const userAgent = req.headers['user-agent'] || '';
     const result = await AuthService.loginUserFromDB(loginData, ip, userAgent);
     const cookieOptions: CookieOptions = { secure: false, httpOnly: true, maxAge: 31536000000 };

     if (config.node_env === 'production') {
          cookieOptions.secure = true;
          cookieOptions.sameSite = 'none';
     }

     if (result.refreshToken) {
          res.cookie('refreshToken', result.refreshToken, cookieOptions);
     }

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'User logged in successfully.',
          data: { accessToken: result.accessToken, refreshToken: result.refreshToken },
     });
});

const forgetPassword = catchAsync(async (req, res) => {
     const email = req.body.email;
     const result = await AuthService.forgetPasswordToDB(email);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Please check your email. We have sent you a one-time passcode (OTP).',
          data: result,
     });
});

const resetPassword = catchAsync(async (req, res) => {
     const token = req.headers.token as string;
     const { ...resetData } = req.body;
     const result = await AuthService.resetPasswordToDB(token!, resetData);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Your password has been successfully reset.',
          data: result,
     });
});

const changePassword = catchAsync(async (req, res) => {
     const user = req.user;
     const { ...passwordData } = req.body;
     const result = await AuthService.changePasswordToDB(user, passwordData);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Your password has been successfully changed',
          data: result,
     });
});
// resend Otp
const resendOtp = catchAsync(async (req, res) => {
     const { email } = req.body;
     await AuthService.resendOtpFromDb(email);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'OTP sent successfully again',
     });
});

// refresh token
const refreshToken = catchAsync(async (req, res) => {
     const refreshToken = (req.headers.token || req.body.refreshToken || req.cookies?.refreshToken || req.headers.refreshtoken) as string;
     const result = await AuthService.refreshToken(refreshToken);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Access token retrieved successfully',
          data: result,
     });
});


const logoutUser = catchAsync(async (req, res) => {
     const user = req.user;
     const { ...logoutData } = req.body;
     await AuthService.logoutUserFromDB(user, logoutData);

     const cookieOptions: CookieOptions = { secure: false, httpOnly: true };

     if (config.node_env === 'production') {
          cookieOptions.secure = true;
          cookieOptions.sameSite = 'none';
     }

     res.clearCookie('refreshToken', cookieOptions);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Logged out successfully',
          data: {},
     });
});

export const AuthController = {
     verifyEmail,
     loginUser,
     forgetPassword,
     resetPassword,
     changePassword,
     resendOtp,
     refreshToken,
     logoutUser,
};
