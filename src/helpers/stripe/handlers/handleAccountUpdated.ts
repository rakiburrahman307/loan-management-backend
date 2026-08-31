import Stripe from 'stripe';
import { StripeConnectedAccount } from '../../../app/modules/stripeConnect/stripeConnectedAccount.model';
import { Borrower } from '../../../app/modules/borrower/borrower.model';

export const handleAccountUpdated = async (account: Stripe.Account) => {
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
};
