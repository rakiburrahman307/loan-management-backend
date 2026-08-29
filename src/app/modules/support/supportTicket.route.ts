import express from 'express';
import auth from '../../middleware/auth';
import { ROLE_GROUPS } from '../../../enums/user';
import { SupportTicketController } from './supportTicket.controller';

const router = express.Router();

router.post('/tickets', auth(...ROLE_GROUPS.USERS), SupportTicketController.createTicket);
router.get('/tickets', auth(...ROLE_GROUPS.USERS), SupportTicketController.getClientTickets);

router.get('/admin/tickets', auth(...ROLE_GROUPS.ADMINS), SupportTicketController.adminGetTickets);
router.patch(
     '/admin/tickets/:id',
     auth(...ROLE_GROUPS.ADMINS),
     SupportTicketController.adminReplyTicket,
);

export const SupportTicketRouter = router;
