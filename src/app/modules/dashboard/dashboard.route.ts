import express from 'express';
import auth from '../../middleware/auth';
import { ROLE_GROUPS } from '../../../enums/user';
import { DashboardController } from './dashboard.controller';

const router = express.Router();

router.get(
     '/admin/overview-cards',
     auth(...ROLE_GROUPS.ADMINS),
     DashboardController.getAdminOverviewCards,
);
router.get(
     '/admin/chart',
     auth(...ROLE_GROUPS.ADMINS),
     DashboardController.getAdminFundingVsRepaymentsChart,
);
router.get(
     '/admin/recent-applications',
     auth(...ROLE_GROUPS.ADMINS),
     DashboardController.getAdminRecentApplications,
);

// clinet route
router.get(
     '/client/overview-cards',
     auth(...ROLE_GROUPS.USERS),
     DashboardController.getClientOverviewCards,
);
router.get(
     '/client/repayment-progress',
     auth(...ROLE_GROUPS.USERS),
     DashboardController.getClientRepaymentProgress,
);
router.get(
     '/client/chart',
     auth(...ROLE_GROUPS.USERS),
     DashboardController.getClientSalesVsRepaymentChart,
);
router.get(
     '/client/recent-transactions',
     auth(...ROLE_GROUPS.USERS),
     DashboardController.getClientRecentTransactions,
);

export const DashboardRouter = router;
