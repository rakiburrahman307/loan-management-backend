import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { NotificationController } from './notification.controller';
import auth from '../../middleware/auth';
const router = express.Router();

router.get('/', auth(USER_ROLES.USER), NotificationController.getNotificationFromDB);
router.get(
     '/admin',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     NotificationController.adminNotificationFromDB,
);
router.patch('/', auth(USER_ROLES.USER), NotificationController.readNotification);
router.patch('/admin', auth(USER_ROLES.USER), NotificationController.adminReadNotification);
router.patch(
     '/send-notifications',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     NotificationController.sendAdminPushNotification,
);

export const NotificationRoutes = router;
