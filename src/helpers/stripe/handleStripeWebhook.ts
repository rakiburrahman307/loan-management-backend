import { Request, Response } from 'express';
import Stripe from 'stripe';
import colors from 'colors';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../shared/logger';
import config from '../../config';
import stripe from '../../config/stripe';
import AppError from '../../errors/AppError';

const handleStripeWebhook = async (req: Request, res: Response) => {
     // Extract Stripe signature and webhook secret
     const signature = req.headers['stripe-signature'] as string;
     const webhookSecret = config.stripe.stripe_webhook_secret as string;

     let event: Stripe.Event | undefined;

     // Verify the event signature
     try {
          event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
     } catch (error) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               `Webhook signature verification failed. ${error}`,
          );
     }

     // Check if the event is valid
     if (!event) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid event received!');
     }

     // Extract event data and type
     const data = event.data.object as Stripe.Subscription | Stripe.Account;
     const eventType = event.type;
     console.log('this is event type', eventType);
     // Handle the event based on its type
     try {
          switch (eventType) {
               // case 'customer.subscription.created':
               //      handleSubscriptionCreated(data as Stripe.Subscription);
               //      break;

               // case 'customer.subscription.updated':
               //      handleSubscriptionUpdated(data as Stripe.Subscription);
               //      break;

               // case 'customer.subscription.deleted':
               //      handleSubscriptionDeleted(data as Stripe.Subscription);
               //      break;

               default:
                    logger.warn(colors.bgGreen.bold(`Unhandled event type: ${eventType}`));
          }
     } catch (error) {
          throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Error handling event: ${error}`);
     }

     res.sendStatus(200);
};

export default handleStripeWebhook;
