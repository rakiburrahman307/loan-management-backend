import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { TransactionController } from './transaction.controller';

const router = express.Router();

router.get('/admin/transactions', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), TransactionController.getAdminTransactions);
router.get('/client/transactions', auth(USER_ROLES.USER), TransactionController.getClientTransactions);

export const TransactionRouter = router;
