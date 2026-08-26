import express from 'express';
import { FcmTokenController } from './fcmToken.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
const router = express.Router();

router.post(
     '/save-device-token',
     auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
     FcmTokenController.saveDeviceToken,
);
router.delete(
     '/delete-device-token',
     auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
     FcmTokenController.deleteDeviceToken,
);

export const FcmTokenRoutes = router;
