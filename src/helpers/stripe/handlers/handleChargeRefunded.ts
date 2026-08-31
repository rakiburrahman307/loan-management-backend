import Stripe from 'stripe';
import { Payment } from '../../../app/modules/payment/payment.model';
import { Refund } from '../../../app/modules/transaction/refund.model';
import { Transaction } from '../../../app/modules/transaction/transaction.model';

export const handleChargeRefunded = async (charge: Stripe.Charge) => {
     const paymentIntentId = charge.payment_intent as string;
     const payment = await Payment.findOne({ paymentIntentId });

     if (payment) {
          payment.status = 'REFUNDED';
          await payment.save();

          await Refund.create({
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
};
