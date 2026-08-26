import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import stripe from '../../../config/stripe';
import AppError from '../../../errors/AppError';
const User: any = '';

export const handleAccountUpdatedEvent = async (data: Stripe.Account) => {
     // Find the user by Stripe account ID
     const existingUser = await User.findOne({
          'stripeAccountInfo.accountId': data.id,
     });

     if (!existingUser) {
          throw new AppError(StatusCodes.NOT_FOUND, `User not found for account ID: ${data.id}`);
     }

     // Check if the onboarding is complete
     if (data.charges_enabled) {
          const loginLink = await stripe.accounts.createLoginLink(data.id);

          // Save Stripe account information to the user record
          await User.findByIdAndUpdate(existingUser?._id, {
               stripeAccountInfo: {
                    accountId: data.id,
                    loginUrl: loginLink.url,
               },
          });
     }
};
