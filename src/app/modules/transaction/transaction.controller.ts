import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { TransactionService } from './transaction.service';
import pick from '../../../shared/pick';

const getAdminTransactions = catchAsync(async (req, res) => {
     const filters = pick(req.query, ['page', 'limit', 'status', 'searchTerm']);
     const result = await TransactionService.getAdminTransactions(filters);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'All transactions retrieved successfully',
          data: result.data,
          meta: result.meta,
     });
});

const getClientTransactions = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const filters = pick(req.query, ['page', 'limit', 'status', 'dateRange']);
     const result = await TransactionService.getClientTransactions(userId, filters);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Transactions retrieved successfully',
          data: result.data,
          meta: result.meta,
     });
});

const getClientTransactionCards = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await TransactionService.getClientTransactionCards(userId);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Client transaction metrics retrieved successfully',
          data: result,
     });
});

export const TransactionController = {
     getAdminTransactions,
     getClientTransactions,
     getClientTransactionCards,
};
