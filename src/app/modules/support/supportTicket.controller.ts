import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SupportTicketService } from './supportTicket.service';
import pick from '../../../shared/pick';

const createTicket = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await SupportTicketService.createTicket(userId, req.body);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Support ticket submitted successfully',
          data: result,
     });
});

const getClientTickets = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await SupportTicketService.getClientTickets(userId);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Support tickets retrieved successfully',
          data: result,
     });
});

const adminGetTickets = catchAsync(async (req, res) => {
     const filters = pick(req.query, ['page', 'limit', 'status', 'searchTerm', 'sort']);
     const result = await SupportTicketService.adminGetTickets(filters);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'All support tickets retrieved successfully',
          data: result.data,
          meta: result.meta,
     });
});

const adminReplyTicket = catchAsync(async (req, res) => {
     const adminId = req.user.id;
     const { id: ticketId } = req.params;
     const result = await SupportTicketService.adminReplyTicket(adminId, ticketId, req.body);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Support ticket updated successfully',
          data: result,
     });
});

export const SupportTicketController = {
     createTicket,
     getClientTickets,
     adminGetTickets,
     adminReplyTicket,
};
