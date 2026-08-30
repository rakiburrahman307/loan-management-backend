import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IntegrationService } from './integration.service';

const createCheckoutSession = catchAsync(async (req, res) => {
     const borrower = req.borrower;
     const result = await IntegrationService.createCheckoutSession(borrower, req.body);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Checkout session created successfully',
          data: result,
     });
});

const verifyApiKey = catchAsync(async (req, res) => {
     const borrower = req.borrower;
     const result = await IntegrationService.verifyApiKey(borrower);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'API Key is valid and active.',
          data: result,
     });
});

export const IntegrationController = {
     createCheckoutSession,
     verifyApiKey,
};
