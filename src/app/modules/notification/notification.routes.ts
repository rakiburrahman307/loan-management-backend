import express from 'express';
import { ROLE_GROUPS } from '../../../enums/user';
import { NotificationController } from './notification.controller';
import auth from '../../middleware/auth';
const router = express.Router();

router.get('/', auth(...ROLE_GROUPS.ALL), NotificationController.getNotificationFromDB);
router.patch('/', auth(...ROLE_GROUPS.ALL), NotificationController.readAllNotification);
router.patch('/read/:id', auth(...ROLE_GROUPS.ALL), NotificationController.readNotification);
router.delete('/', auth(...ROLE_GROUPS.ALL), NotificationController.deleteAllNotifications);
router.delete('/:id', auth(...ROLE_GROUPS.ALL), NotificationController.deleteNotification);

export const NotificationRoutes = router;
