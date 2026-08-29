import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StripeConnectService } from './stripeConnect.service';
import config from '../../../config';

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

/**
 * Called by Stripe when the onboarding link expires or becomes invalid.
 * Generates a fresh account link and redirects the user back to Stripe.
 * No auth required — Stripe calls this URL directly.
 */
const refreshOnboardingLink = async (req: Request, res: Response): Promise<void> => {
     const { accountId } = req.query as { accountId: string };

     if (!accountId) {
          res.redirect(`${config.backend_url}/payouts/failed`);
          return;
     }

     try {
          const url = await StripeConnectService.refreshLinkByAccountId(accountId);
          res.redirect(url);
     } catch {
          res.redirect(`${config.backend_url}/payouts/failed`);
     }
};

export const StripeConnectController = {
     onboardAccount,
     getStatus,
     refreshOnboardingLink,
};
