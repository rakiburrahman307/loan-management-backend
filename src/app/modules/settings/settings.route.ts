import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { settingsController } from './settings.controller';
import auth from '../../middleware/auth';

const SettingsRouter = express.Router();

SettingsRouter.put(
     '/',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     settingsController.addSetting,
).get('/', settingsController.getSettings);

export default SettingsRouter;
