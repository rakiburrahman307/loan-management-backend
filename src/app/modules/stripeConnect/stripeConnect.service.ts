import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import config from '../../../config';
import stripe from '../../../config/stripe';
import { StripeConnectedAccount } from './stripeConnectedAccount.model';
import { Borrower } from '../borrower/borrower.model';
import { Loan } from '../loan/loan.model';
import { Transaction } from '../transaction/transaction.model';

const onboardAccount = async (userId: string) => {
     let connectedAccount = await StripeConnectedAccount.findOne({ userId });

     let accountId = connectedAccount?.accountId;

     if (!connectedAccount) {
          // Create Stripe Connected Express Account
          try {
               const account = await stripe.accounts.create({
                    type: 'express',
                    country: 'GB', // Default to GB for UK-based CRN
                    capabilities: {
                         card_payments: { requested: true },
                         transfers: { requested: true },
                    },
               });
               accountId = account.id;

               connectedAccount = await StripeConnectedAccount.create({
                    userId,
                    accountId: account.id,
                    status: 'PENDING',
               });

               // Also update the Borrower profile references
               await Borrower.findOneAndUpdate({ userId }, { stripeAccountId: account.id });
          } catch (error: any) {
               throw new AppError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    `Failed to create Stripe connected account: ${error.message}`,
               );
          }
     }

     // Generate Stripe Account Link
     try {
          const accountLink = await stripe.accountLinks.create({
               account: accountId as string,
               refresh_url: `${config.backend_url}/api/v1/client/payouts/stripe-onboard`,
               return_url: `${config.frontend_url}/payouts?status=success`,
               type: 'account_onboarding',
          });

          connectedAccount.onboardingUrl = accountLink.url;
          await connectedAccount.save();

          return { url: accountLink.url };
     } catch (error: any) {
          throw new AppError(
               StatusCodes.INTERNAL_SERVER_ERROR,
               `Failed to generate Stripe onboarding link: ${error.message}`,
          );
     }
};

const getStatus = async (userId: string) => {
     const connectedAccount = await StripeConnectedAccount.findOne({ userId });
     if (!connectedAccount) {
          return {
               connected: false,
               chargesEnabled: false,
               payoutsEnabled: false,
               detailsSubmitted: false,
          };
     }

     // Retrieve actual details from Stripe
     try {
          const account = await stripe.accounts.retrieve(connectedAccount.accountId);
          connectedAccount.chargesEnabled = account.charges_enabled;
          connectedAccount.payoutsEnabled = account.payouts_enabled;
          connectedAccount.detailsSubmitted = account.details_submitted;

          if (account.charges_enabled) {
               connectedAccount.status = 'ACTIVE';
          }
          await connectedAccount.save();

          // Sync Borrower profile too
          await Borrower.findOneAndUpdate(
               { userId },
               {
                    stripeAccountId: connectedAccount.accountId,
                    stripeOnboardingComplete: account.charges_enabled,
               },
          );

          // If onboarding was completed and they had a PENDING loan disbursement, trigger it!
          if (account.charges_enabled) {
               const borrower = await Borrower.findOne({ userId });
               if (borrower) {
                    const pendingLoan = await Loan.findOne({
                         borrowerId: borrower._id,
                         disbursementStatus: 'PENDING',
                    });

                    if (pendingLoan) {
                         // Attempt automated disbursement
                         try {
                              const transfer = await stripe.transfers.create({
                                   amount: Math.floor(pendingLoan.principalAmount * 100),
                                   currency: 'gbp',
                                   destination: connectedAccount.accountId,
                                   description: `Automated post-onboarding disbursement for Loan: ${pendingLoan._id}`,
                              });

                              pendingLoan.disbursementStatus = 'DISBURSED';
                              pendingLoan.stripeTransferId = transfer.id;
                              await pendingLoan.save();

                              await Transaction.create({
                                   loanId: pendingLoan._id,
                                   borrowerId: borrower._id,
                                   type: 'DISBURSEMENT',
                                   amount: pendingLoan.principalAmount,
                                   status: 'SUCCESS',
                                   stripeTransferId: transfer.id,
                                   description: `Automated disbursement of £${pendingLoan.principalAmount} succeeded after Stripe onboarding completed`,
                              });
                         } catch (disburseError: any) {
                              console.error('Post-onboarding disbursement failed:', disburseError);
                              pendingLoan.disbursementStatus = 'FAILED';
                              await pendingLoan.save();

                              await Transaction.create({
                                   loanId: pendingLoan._id,
                                   borrowerId: borrower._id,
                                   type: 'DISBURSEMENT',
                                   amount: pendingLoan.principalAmount,
                                   status: 'FAILED',
                                   description: `Automated disbursement failed: ${disburseError.message}`,
                              });
                         }
                    }
               }
          }

          return {
               connected: true,
               chargesEnabled: account.charges_enabled,
               payoutsEnabled: account.payouts_enabled,
               detailsSubmitted: account.details_submitted,
               accountId: connectedAccount.accountId,
          };
     } catch (error: any) {
          throw new AppError(
               StatusCodes.INTERNAL_SERVER_ERROR,
               `Failed to fetch Stripe connected account status: ${error.message}`,
          );
     }
};

export const StripeConnectService = {
     onboardAccount,
     getStatus,
};
