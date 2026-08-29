import express from 'express';
import auth from '../../middleware/auth';
import { ROLE_GROUPS } from '../../../enums/user';
import { PayoutController } from './payout.controller';

const router = express.Router();

// GET /api/v1/client-payouts/cards
router.get('/cards', auth(...ROLE_GROUPS.USERS), PayoutController.getClientPayoutCards);

// GET /api/v1/client-payouts/history?page=1&limit=10&status=succeeded&dateRange=last30days
router.get('/history', auth(...ROLE_GROUPS.USERS), PayoutController.getClientPayoutHistory);

export const PayoutRouter = router;
