import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StripeConnectService } from './stripeConnect.service';

const onboardAccount = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await StripeConnectService.onboardAccount(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Stripe onboarding link generated successfully',
          data: result,
     });
});

const getStatus = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await StripeConnectService.getStatus(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Stripe onboarding status retrieved successfully',
          data: result,
     });
});

export const StripeConnectController = {
     onboardAccount,
     getStatus,
};
