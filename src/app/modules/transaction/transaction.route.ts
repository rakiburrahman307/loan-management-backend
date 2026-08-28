import express from 'express';
import auth from '../../middleware/auth';
import { ROLE_GROUPS } from '../../../enums/user';
import { TransactionController } from './transaction.controller';

const router = express.Router();

router.get(
     '/admin/transactions',
     auth(...ROLE_GROUPS.ADMINS),
     TransactionController.getAdminTransactions,
);

router.get(
     '/client/transactions',
     auth(...ROLE_GROUPS.USERS),
     TransactionController.getClientTransactions,
);

router.get(
     '/client/transactions-cards',
     auth(...ROLE_GROUPS.USERS),
     TransactionController.getClientTransactionCards,
);

export const TransactionRouter = router;
