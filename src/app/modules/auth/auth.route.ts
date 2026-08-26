import express from 'express';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { authLimiter, strictLimiter } from '../../../DB/security';
import { ROLE_GROUPS } from '../../../enums/user';
const router = express.Router();

router.post(
     '/login',
     authLimiter,
     validateRequest(AuthValidation.createLoginZodSchema),
     AuthController.loginUser,
);
router.post('/refresh-token', AuthController.refreshToken);
router.post(
     '/forget-password',
     authLimiter,
     validateRequest(AuthValidation.createForgetPasswordZodSchema),
     AuthController.forgetPassword,
);
router.post(
     '/verify-otp',
     authLimiter,
     validateRequest(AuthValidation.createVerifyEmailZodSchema),
     AuthController.verifyEmail,
);
router.post(
     '/reset-password',
     strictLimiter,
     validateRequest(AuthValidation.createResetPasswordZodSchema),
     AuthController.resetPassword,
);
router.post(
     '/change-password',
     auth(...ROLE_GROUPS.ALL),
     validateRequest(AuthValidation.createChangePasswordZodSchema),
     AuthController.changePassword,
);
router.post('/resend-otp', authLimiter, AuthController.resendOtp);
router.post('/logout', auth(...ROLE_GROUPS.ALL), AuthController.logoutUser);
// OAuth Routes
router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleAuthCallback);
router.get('/facebook', AuthController.facebookAuth);
router.get('/facebook/callback', AuthController.facebookAuthCallback);

export const AuthRouter = router;
