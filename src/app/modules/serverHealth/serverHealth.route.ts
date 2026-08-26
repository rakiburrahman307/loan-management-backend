import express from 'express';
import { ServerHealthControllers } from './serverHealth.controller';
import auth from '../../middleware/auth';
import { ROLE_GROUPS } from '../../../enums/user';

const router = express.Router();

router.get('/', auth(...ROLE_GROUPS.ADMINS), ServerHealthControllers.serverHealth);

export const ServerHealthRoutes = router;
