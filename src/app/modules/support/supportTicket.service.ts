import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { SupportTicket } from './supportTicket.model';
import { User } from '../user/user.model';

const createTicket = async (userId: string, payload: { subject: string; message: string }) => {
     if (!payload.subject || !payload.message) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Subject and message are required.');
     }

     const ticket = await SupportTicket.create({
          userId,
          subject: payload.subject,
          message: payload.message,
          status: 'OPEN',
     });

     return ticket;
};

const getClientTickets = async (userId: string) => {
     return SupportTicket.find({ userId }).sort({ createdAt: -1 });
};

const adminGetTickets = async (filters: {
     page?: number;
     limit?: number;
     status?: string;
     searchTerm?: string;
     sort?: string;
}) => {
     const page = Number(filters.page || 1);
     const limit = Number(filters.limit || 10);
     const skip = (page - 1) * limit;

     const query: any = {};

     // Status filter
     if (filters.status) {
          query.status = filters.status.toUpperCase();
     }

     // Search logic
     if (filters.searchTerm) {
          const searchRegex = new RegExp(filters.searchTerm, 'i');
          
          // Find user IDs whose name or email matches searchTerm
          const users = await User.find({
               $or: [
                    { name: searchRegex },
                    { email: searchRegex },
               ],
          }).select('_id');
          
          const userIds = users.map(user => user._id);

          query.$or = [
               { subject: searchRegex },
               { message: searchRegex },
               { userId: { $in: userIds } },
          ];
     }

     // Sorting logic ("most-recent", "oldest", etc.)
     let sortOrder: any = { createdAt: -1 }; // default: most recent first
     if (filters.sort) {
          const sortVal = filters.sort.toLowerCase();
          if (sortVal === 'oldest' || sortVal === 'asc') {
               sortOrder = { createdAt: 1 };
          } else if (sortVal === 'most-recent' || sortVal === 'desc') {
               sortOrder = { createdAt: -1 };
          }
     }

     const [total, tickets] = await Promise.all([
          SupportTicket.countDocuments(query),
          SupportTicket.find(query)
               .sort(sortOrder)
               .skip(skip)
               .limit(limit)
               .populate('userId', 'name email'),
     ]);

     return {
          meta: {
               page,
               limit,
               total,
               totalPage: Math.ceil(total / limit),
          },
          data: tickets,
     };
};

const adminReplyTicket = async (
     adminId: string,
     ticketId: string,
     payload: { message?: string; status?: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' },
) => {
     const { message, status } = payload;

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

     return updatedTicket;
};

export const SupportTicketService = {
     createTicket,
     getClientTickets,
     adminGetTickets,
     adminReplyTicket,
};
