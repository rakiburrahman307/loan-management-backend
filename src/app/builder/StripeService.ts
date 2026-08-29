import Stripe from 'stripe';
import stripe from '../../config/stripe';
import config from '../../config';

class StripeService {
     // ─── Connected Accounts ────────────────────────────────────────────────────

     /** Create an Express connected account (UK, card_payments + transfers) */
     async createConnectedAccount(options: { email?: string; country?: string } = {}): Promise<Stripe.Account> {
          return stripe.accounts.create({
               type: 'express',
               country: options.country || 'GB',
               ...(options.email ? { email: options.email } : {}),
               capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
               },
          });
     }

     /** Retrieve a connected account from Stripe */
     async retrieveAccount(accountId: string): Promise<Stripe.Account> {
          return stripe.accounts.retrieve(accountId);
     }

     /** Generate an onboarding account link (language set via Stripe Dashboard → Connect → Branding) */
     async createAccountLink(
          accountId: string,
          returnUrl: string = `${config.backend_url}/payouts?status=success`,
          refreshUrl: string = `${config.backend_url}/api/v1/payouts/stripe-refresh?accountId=${accountId}`,
     ): Promise<string> {
          const accountLink = await stripe.accountLinks.create({
               account: accountId,
               refresh_url: refreshUrl,
               return_url: returnUrl,
               type: 'account_onboarding',
          });
          return accountLink.url;
     }

     /** Generate a Stripe Express Dashboard login link */
     async createLoginLink(accountId: string): Promise<string> {
          const loginLink = await stripe.accounts.createLoginLink(accountId);
          return loginLink.url;
     }

     // ─── Payments & Checkout ───────────────────────────────────────────────────

     /** Create a Stripe Checkout session */
     async createCheckoutSession(
          customerEmail: string,
          amount: number,
          metadata: Record<string, string> = {},
          successUrl: string = `${config.backend_url}/payouts?status=success`,
          cancelUrl: string = `${config.backend_url}/payouts/failed`,
     ) {
          const session = await stripe.checkout.sessions.create({
               payment_method_types: ['card'],
               line_items: [
                    {
                         price_data: {
                              currency: 'gbp',
                              product_data: {
                                   name: 'Revenue Financing — Merchant Payment',
                              },
                              unit_amount: Math.round(Number(amount) * 100),
                         },
                         quantity: 1,
                    },
               ],
               mode: 'payment',
               customer_email: customerEmail,
               success_url: successUrl,
               cancel_url: cancelUrl,
               payment_intent_data: {},
               metadata: {
                    customer_email: customerEmail,
                    amount: Math.round(Number(amount)).toString(),
                    ...metadata,
               },
          });

          return { sessionId: session.id, url: session.url as string };
     }

     // ─── Transfers ─────────────────────────────────────────────────────────────

     /**
      * Transfer funds to a connected account (disbursement)
      * @param amountInMajorUnits - amount in pounds (will be converted to pence)
      */
     async createTransfer(
          amountInMajorUnits: number,
          destinationAccountId: string,
          currency: string = 'gbp',
          description?: string,
          metadata: Record<string, string> = {},
     ): Promise<Stripe.Transfer> {
          return stripe.transfers.create({
               amount: Math.floor(amountInMajorUnits * 100),
               currency,
               destination: destinationAccountId,
               ...(description ? { description } : {}),
               ...(Object.keys(metadata).length ? { metadata } : {}),
          });
     }

     // ─── Refunds ───────────────────────────────────────────────────────────────

     /** Issue a full or partial refund on a charge or payment intent */
     async createRefund(
          paymentIntentId: string,
          amountInMajorUnits?: number,
     ): Promise<Stripe.Refund> {
          return stripe.refunds.create({
               payment_intent: paymentIntentId,
               ...(amountInMajorUnits ? { amount: Math.floor(amountInMajorUnits * 100) } : {}),
          });
     }

     // ─── Payment Intents ───────────────────────────────────────────────────────

     /** Retrieve a payment intent */
     async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
          return stripe.paymentIntents.retrieve(paymentIntentId);
     }
}

export default new StripeService();
