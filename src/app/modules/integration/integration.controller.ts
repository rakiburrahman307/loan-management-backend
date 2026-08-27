import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import AppError from '../../../errors/AppError';
import stripe from '../../../config/stripe';
import { Payment } from '../payment/payment.model';

const createCheckoutSession = catchAsync(async (req, res) => {
     const borrower = req.borrower;
     const { amount, currency = 'gbp', customerEmail, successUrl, cancelUrl, metadata = {} } = req.body;

     if (!amount || typeof amount !== 'number' || amount <= 0) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Valid amount is required.');
     }

     if (!successUrl || !cancelUrl) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'successUrl and cancelUrl are required.');
     }

     // Ensure borrower Stripe onboarding is complete
     if (!borrower.stripeAccountId || !borrower.stripeOnboardingComplete) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               'Store payments cannot be processed. Stripe connected account onboarding is incomplete.',
          );
     }

     // Create Stripe Checkout Session on the Platform account
     const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
               {
                    price_data: {
                         currency: currency.toLowerCase(),
                         product_data: {
                              name: `Purchase from ${borrower.businessDetails?.legalName || 'Partner Merchant'}`,
                         },
                         unit_amount: Math.floor(amount * 100), // Convert to pence/cents
                    },
                    quantity: 1,
               },
          ],
          mode: 'payment',
          success_url: successUrl,
          cancel_url: cancelUrl,
          customer_email: customerEmail,
          metadata: {
               borrowerId: borrower._id.toString(),
               userId: borrower.userId.toString(),
               saleAmount: amount.toString(),
               ...metadata,
          },
     });

     // Store draft Payment details locally
     await Payment.create({
          borrowerId: borrower._id,
          paymentIntentId: 'checkout_session_' + session.id, // temporary placeholder until session succeeds
          checkoutSessionId: session.id,
          amount: Math.floor(amount * 100),
          currency: currency.toLowerCase(),
          status: 'PENDING',
          customerEmail: customerEmail || '',
          metadata: { ...metadata, saleAmount: amount },
     });

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Checkout session created successfully',
          data: {
               sessionId: session.id,
               url: session.url,
          },
     });
});

export const IntegrationController = {
     createCheckoutSession,
};
