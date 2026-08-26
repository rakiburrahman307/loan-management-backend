import express from 'express';
import auth from '../../middleware/auth';
import { SessionController } from './session.controller';
import { ROLE_GROUPS } from '../../../enums/user';

const router = express.Router();

router.get('/', auth(...ROLE_GROUPS.ALL), SessionController.getActiveSessions);

router.delete('/other', auth(...ROLE_GROUPS.ALL), SessionController.revokeOtherSessions);

router.delete('/:id', auth(...ROLE_GROUPS.ALL), SessionController.revokeSession);

export const SessionRouter = router;
