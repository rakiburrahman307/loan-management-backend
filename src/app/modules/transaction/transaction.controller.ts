import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { Transaction } from './transaction.model';
import { Borrower } from '../borrower/borrower.model';

const getAdminTransactions = catchAsync(async (req, res) => {
     const result = await Transaction.find()
          .sort({ createdAt: -1 })
          .populate({
               path: 'borrowerId',
               populate: { path: 'userId', select: 'name email' },
          });

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'All transactions retrieved successfully',
          data: result,
     });
});

const getClientTransactions = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const borrower = await Borrower.findOne({ userId });

     if (!borrower) {
          return sendResponse(res, {
               success: true,
               statusCode: StatusCodes.OK,
               message: 'No transactions found',
               data: [],
          });
     }

     const result = await Transaction.find({ borrowerId: borrower._id }).sort({ createdAt: -1 });

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Transactions retrieved successfully',
          data: result,
     });
});

export const TransactionController = {
     getAdminTransactions,
     getClientTransactions,
};
