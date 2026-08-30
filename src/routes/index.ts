import express from 'express';
import { UserRouter } from '../app/modules/user/user.route';
import { AuthRouter } from '../app/modules/auth/auth.route';
import { SettingsRoute } from '../app/modules/settings/settings.route';
import { SessionRouter } from '../app/modules/session/session.route';
import { UserManagementsRouter } from '../app/modules/userManagements/userManagements.router';
import { FaqRoutes } from '../app/modules/faq/faq.route';
import { BorrowerRouter } from '../app/modules/borrower/borrower.route';
import { LoanRouter } from '../app/modules/loan/loan.route';
import { StripeConnectRouter } from '../app/modules/stripeConnect/stripeConnect.route';
import { IntegrationRouter } from '../app/modules/integration/integration.route';
import { TransactionRouter } from '../app/modules/transaction/transaction.route';
import { DashboardRouter } from '../app/modules/dashboard/dashboard.route';
import { SupportTicketRouter } from '../app/modules/support/supportTicket.route';
import { PayoutRouter } from '../app/modules/payout/payout.route';
import { ContactUsRouter } from '../app/modules/contactUs/contactUs.route';
import { NotificationRoutes } from '../app/modules/notification/notification.routes';

const router = express.Router();
const routes = [
     {
          path: '/auth',
          route: AuthRouter,
     },
     {
          path: '/users',
          route: UserRouter,
     },
     {
          path: '/settings',
          route: SettingsRoute,
     },
     {
          path: '/sessions',
          route: SessionRouter,
     },
     {
          path: '/user-managements',
          route: UserManagementsRouter,
     },
     {
          path: '/faqs',
          route: FaqRoutes,
     },
     {
          path: '/borrowers',
          route: BorrowerRouter,
     },
     {
          path: '/loans',
          route: LoanRouter,
     },
     {
          path: '/payouts',
          route: StripeConnectRouter,
     },
     {
          path: '/integrations',
          route: IntegrationRouter,
     },
     {
          path: '/transactions',
          route: TransactionRouter,
     },
     {
          path: '/dashboard',
          route: DashboardRouter,
     },
     {
          path: '/support',
          route: SupportTicketRouter,
     },
     {
          path: '/client-payouts',
          route: PayoutRouter,
     },
     {
          path: '/contact-us',
          route: ContactUsRouter,
     },
     {
          path: '/notifications',
          route: NotificationRoutes,
     },
];

routes.forEach((element) => {
     if (element?.path && element?.route) {
          router.use(element?.path, element?.route);
     }
});

export default router;
