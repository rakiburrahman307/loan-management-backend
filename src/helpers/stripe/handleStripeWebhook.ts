import { Request, Response } from 'express';
import Stripe from 'stripe';
import colors from 'colors';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../shared/logger';
import config from '../../config';
import stripe from '../../config/stripe';
import AppError from '../../errors/AppError';
import { WebhookEvent } from '../../app/modules/stripeConnect/webhookEvent.model';
import {
     handleAccountUpdated,
     handleCheckoutSessionCompleted,
     handleChargeRefunded,
     handleChargeDisputeCreated,
} from './handlers';

const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
     // Extract Stripe signature and webhook secret
     const signature = req.headers['stripe-signature'] as string;
     const webhookSecret = config.stripe.stripe_webhook_secret as string;

     if (!webhookSecret) {
          logger.error('STRIPE_WEBHOOK_SECRET is not set in environment variables!');
          res.status(500).json({ error: 'Webhook secret not configured on server.' });
          return;
     }

     if (!signature) {
          res.status(400).json({ error: 'Missing stripe-signature header.' });
          return;
     }

     let event: Stripe.Event | undefined;

     try {
          event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
     } catch (error) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               `Webhook signature verification failed. ${error}`,
          );
     }

     if (!event) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid event received!');
     }

     // Ensure idempotency by tracking event ID
     const existingEvent = await WebhookEvent.findOne({ eventId: event.id });
     if (existingEvent && existingEvent.processed) {
          logger.info(`Stripe webhook event ${event.id} already processed. Skipping.`);
          res.sendStatus(200);
          return;
     }

     // Create temporary event record
     const dbEvent = await WebhookEvent.create({
          eventId: event.id,
          type: event.type,
          processed: false,
     });

     const data = event.data.object;
     const eventType = event.type;
     console.log('Stripe webhook event received:', eventType);

     try {
          switch (eventType) {
               case 'account.updated':
                    await handleAccountUpdated(data as Stripe.Account);
                    break;

               case 'checkout.session.completed':
                    await handleCheckoutSessionCompleted(data as Stripe.Checkout.Session);
                    break;

               case 'charge.refunded':
                    await handleChargeRefunded(data as Stripe.Charge);
                    break;

               case 'charge.dispute.created':
                    await handleChargeDisputeCreated(data as Stripe.Dispute);
                    break;

               default:
                    logger.warn(colors.bgGreen.bold(`Unhandled event type: ${eventType}`));
          }

          // Mark event as processed
          dbEvent.processed = true;
          dbEvent.processedAt = new Date();
          await dbEvent.save();
     } catch (error: any) {
          dbEvent.error = error.message || error;
          await dbEvent.save();
          throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, `Error handling event: ${error.message}`);
     }

     res.sendStatus(200);
};

export default handleStripeWebhook;
