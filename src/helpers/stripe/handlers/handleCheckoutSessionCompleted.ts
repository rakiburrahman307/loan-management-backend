import Stripe from 'stripe';
import { PaymentSplitService } from '../../../app/modules/payment/paymentSplit.service';

export const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
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
};
