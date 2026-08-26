import { StatusCodes } from 'http-status-codes';
import stripe from '../../config/stripe';
import AppError from '../../errors/AppError';

export const updateSubscriptionProduct = async (subscriptionId: string, newPriceId: string) => {
     try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
               items: [
                    {
                         id: subscription.items.data[0].id,
                         price: newPriceId,
                    },
               ],
          });

          // This will trigger the `customer.subscription.updated` event in Stripe
          return updatedSubscription;
     } catch (error: any) {
          throw new AppError(
               StatusCodes.INTERNAL_SERVER_ERROR,
               `Error updating subscription: ${error.message}`,
          );
     }
};
