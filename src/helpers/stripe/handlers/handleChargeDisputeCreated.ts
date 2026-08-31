import Stripe from 'stripe';
import { Payment } from '../../../app/modules/payment/payment.model';
import { Chargeback } from '../../../app/modules/transaction/chargeback.model';
import { Transaction } from '../../../app/modules/transaction/transaction.model';

export const handleChargeDisputeCreated = async (dispute: Stripe.Dispute) => {
     const paymentIntentId = dispute.charge as string;
     const payment = await Payment.findOne({ paymentIntentId });

     if (payment) {
          await Chargeback.create({
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
};
