import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SupportTicket } from './supportTicket.model';
import AppError from '../../../errors/AppError';

const createTicket = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const { subject, message } = req.body;

     if (!subject || !message) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Subject and message are required.');
     }

     const ticket = await SupportTicket.create({
          userId,
          subject,
          message,
          status: 'OPEN',
     });

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Support ticket submitted successfully',
          data: ticket,
     });
});

const getClientTickets = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const tickets = await SupportTicket.find({ userId }).sort({ createdAt: -1 });

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Support tickets retrieved successfully',
          data: tickets,
     });
});

const adminGetTickets = catchAsync(async (req, res) => {
     const tickets = await SupportTicket.find()
          .sort({ createdAt: -1 })
          .populate('userId', 'name email');

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'All support tickets retrieved successfully',
          data: tickets,
     });
});

const adminReplyTicket = catchAsync(async (req, res) => {
     const adminId = req.user.id;
     const { id: ticketId } = req.params;
     const { message, status } = req.body;

     if (!message && !status) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Please provide status update or reply message.');
     }

     const ticket = await SupportTicket.findById(ticketId);
     if (!ticket) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Support ticket not found');
     }

     const updates: any = {};
     if (status) {
          updates.status = status;
     }

     if (message) {
          updates.$push = {
               replies: {
                    senderId: adminId,
                    message,
                    createdAt: new Date(),
               },
          };
          if (!status && ticket.status === 'OPEN') {
               updates.status = 'IN_PROGRESS';
          }
     }

     const updatedTicket = await SupportTicket.findByIdAndUpdate(
          ticketId,
          updates,
          { new: true },
     ).populate('userId', 'name email');

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Support ticket updated successfully',
          data: updatedTicket,
     });
});

export const SupportTicketController = {
     createTicket,
     getClientTickets,
     adminGetTickets,
     adminReplyTicket,
};
