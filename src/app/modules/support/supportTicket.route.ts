import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { SupportTicketController } from './supportTicket.controller';

const router = express.Router();

router.post('/tickets', auth(USER_ROLES.USER), SupportTicketController.createTicket);
router.get('/tickets', auth(USER_ROLES.USER), SupportTicketController.getClientTickets);

router.get('/admin/tickets', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), SupportTicketController.adminGetTickets);
router.patch('/admin/tickets/:id', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), SupportTicketController.adminReplyTicket);

export const SupportTicketRouter = router;
