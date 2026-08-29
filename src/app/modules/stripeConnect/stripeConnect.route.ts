import express from 'express';
import auth from '../../middleware/auth';
import { ROLE_GROUPS } from '../../../enums/user';
import { StripeConnectController } from './stripeConnect.controller';

const router = express.Router();

router.post('/stripe-onboard', auth(...ROLE_GROUPS.USERS), StripeConnectController.onboardAccount);
router.get('/stripe-status', auth(...ROLE_GROUPS.USERS), StripeConnectController.getStatus);

// Public — Stripe calls this when the onboarding link expires (no auth needed)
router.get('/stripe-refresh', StripeConnectController.refreshOnboardingLink);

export const StripeConnectRouter = router;
