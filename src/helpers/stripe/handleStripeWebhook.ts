import { Request, Response } from 'express';
import Stripe from 'stripe';
import colors from 'colors';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../shared/logger';
import config from '../../config';
import stripe from '../../config/stripe';
import AppError from '../../errors/AppError';
import { WebhookEvent } from '../../app/modules/stripeConnect/webhookEvent.model';
import { StripeConnectedAccount } from '../../app/modules/stripeConnect/stripeConnectedAccount.model';
import { Borrower } from '../../app/modules/borrower/borrower.model';
import { PaymentSplitService } from '../../app/modules/payment/paymentSplit.service';
import { Transaction } from '../../app/modules/transaction/transaction.model';
import { Refund } from '../../app/modules/transaction/refund.model';
import { Chargeback } from '../../app/modules/transaction/chargeback.model';
import { Payment } from '../../app/modules/payment/payment.model';

const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
     // Extract Stripe signature and webhook secret
     const signature = req.headers['stripe-signature'] as string;
     const webhookSecret = config.stripe.stripe_webhook_secret as string;

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
               case 'account.updated': {
                    const account = data as Stripe.Account;
                    const connectedAccount = await StripeConnectedAccount.findOne({ accountId: account.id });
                    if (connectedAccount) {
                         connectedAccount.chargesEnabled = account.charges_enabled;
                         connectedAccount.payoutsEnabled = account.payouts_enabled;
                         connectedAccount.detailsSubmitted = account.details_submitted;
                         if (account.charges_enabled) {
                              connectedAccount.status = 'ACTIVE';
                         }
                         await connectedAccount.save();

                         // Sync Borrower profile too
                         await Borrower.findOneAndUpdate(
                              { userId: connectedAccount.userId },
                              {
                                   stripeAccountId: account.id,
                                   stripeOnboardingComplete: account.charges_enabled,
                              },
                         );
                    }
                    break;
               }

               case 'checkout.session.completed': {
                    const session = data as Stripe.Checkout.Session;
                    if (session.payment_status === 'paid') {
                         const checkoutSessionId = session.id;
                         const paymentIntentId = session.payment_intent as string;
                         const totalAmount = session.amount_total || 0;
                         const customerEmail = session.customer_details?.email || undefined;

                         await PaymentSplitService.handlePaymentSuccess(
                              checkoutSessionId,
                              paymentIntentId,
                              totalAmount,
                              customerEmail,
                         );
                    }
                    break;
               }

               case 'charge.refunded': {
                    const charge = data as Stripe.Charge;
                    const paymentIntentId = charge.payment_intent as string;
                    const payment = await Payment.findOne({ paymentIntentId });

                    if (payment) {
                         payment.status = 'REFUNDED';
                         await payment.save();

                         const refundRecord = await Refund.create({
                              paymentId: payment._id,
                              amount: charge.amount_refunded / 100, // to major units
                              reason: charge.failure_message || 'Customer Refund',
                              status: 'SUCCESS',
                              stripeRefundId: charge.refunds?.data[0]?.id || '',
                         });

                         await Transaction.create({
                              borrowerId: payment.borrowerId,
                              paymentId: payment._id,
                              type: 'REFUND',
                              amount: charge.amount_refunded / 100,
                              currency: payment.currency,
                              status: 'SUCCESS',
                              stripeTransferId: charge.refunds?.data[0]?.id || '',
                              description: `Refund processed for payment: ${paymentIntentId}`,
                         });
                    }
                    break;
               }

               case 'charge.dispute.created': {
                    const dispute = data as Stripe.Dispute;
                    const paymentIntentId = dispute.charge as string;
                    const payment = await Payment.findOne({ paymentIntentId });

                    if (payment) {
                         const chargeback = await Chargeback.create({
                              paymentId: payment._id,
                              amount: dispute.amount / 100,
                              reason: dispute.reason,
                              status: 'PENDING',
                              stripeDisputeId: dispute.id,
                         });

                         await Transaction.create({
                              borrowerId: payment.borrowerId,
                              paymentId: payment._id,
                              type: 'CHARGEBACK',
                              amount: dispute.amount / 100,
                              currency: payment.currency,
                              status: 'PENDING',
                              description: `Dispute/Chargeback created by customer. Reason: ${dispute.reason}`,
                         });
                    }
                    break;
               }

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
