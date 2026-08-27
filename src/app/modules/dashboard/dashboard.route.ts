import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { DashboardController } from './dashboard.controller';

const router = express.Router();

router.get(
     '/admin/overview-cards',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     DashboardController.getAdminOverviewCards,
);
router.get(
     '/admin/chart',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     DashboardController.getAdminFundingVsRepaymentsChart,
);
router.get(
     '/admin/recent-applications',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     DashboardController.getAdminRecentApplications,
);

// clinet route
router.get(
     '/client/overview-cards',
     auth(USER_ROLES.USER),
     DashboardController.getClientOverviewCards,
);
router.get(
     '/client/repayment-progress',
     auth(USER_ROLES.USER),
     DashboardController.getClientRepaymentProgress,
);
router.get(
     '/client/chart',
     auth(USER_ROLES.USER),
     DashboardController.getClientSalesVsRepaymentChart,
);
router.get(
     '/client/recent-transactions',
     auth(USER_ROLES.USER),
     DashboardController.getClientRecentTransactions,
);

export const DashboardRouter = router;
