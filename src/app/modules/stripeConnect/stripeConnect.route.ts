import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { StripeConnectController } from './stripeConnect.controller';

const router = express.Router();

router.post('/stripe-onboard', auth(USER_ROLES.USER), StripeConnectController.onboardAccount);
router.get('/stripe-status', auth(USER_ROLES.USER), StripeConnectController.getStatus);

export const StripeConnectRouter = router;
