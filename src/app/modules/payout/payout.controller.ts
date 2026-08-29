import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { PayoutService } from './payout.service';
import pick from '../../../shared/pick';

const getClientPayoutCards = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await PayoutService.getClientPayoutCards(userId);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Payout overview cards retrieved successfully',
          data: result,
     });
});

const getClientPayoutHistory = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const filters = pick(req.query, ['page', 'limit', 'status', 'dateRange']);
     const result = await PayoutService.getClientPayoutHistory(userId, filters);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Payout history retrieved successfully',
          data: result.data,
          meta: result.meta,
     });
});

export const PayoutController = {
     getClientPayoutCards,
     getClientPayoutHistory,
};
