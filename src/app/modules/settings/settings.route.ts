import express from 'express';
import { ROLE_GROUPS } from '../../../enums/user';
import { settingsController } from './settings.controller';
import auth from '../../middleware/auth';

const router = express.Router();

router
     .put('/', auth(...ROLE_GROUPS.ADMINS), settingsController.addSetting)
     .get('/', settingsController.getSettings);

export const SettingsRoute = router;
