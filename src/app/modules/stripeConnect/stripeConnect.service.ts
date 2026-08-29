import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import StripeService from '../../builder/StripeService';
import { StripeConnectedAccount } from './stripeConnectedAccount.model';
import { Borrower } from '../borrower/borrower.model';
import { Loan } from '../loan/loan.model';
import { Transaction } from '../transaction/transaction.model';

const onboardAccount = async (userId: string) => {
     let connectedAccount = await StripeConnectedAccount.findOne({ userId });

     let accountId = connectedAccount?.accountId;

     if (!connectedAccount) {
          // Create Stripe Connected Express Account via StripeService
          try {
               // { country: 'GB' }
               const account = await StripeService.createConnectedAccount({ country: 'US' });
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

     // Generate Stripe Account Link via StripeService
     try {
          const url = await StripeService.createAccountLink(accountId as string);

          connectedAccount.onboardingUrl = url;
          await connectedAccount.save();

          return { url };
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

     // Retrieve actual details from Stripe via StripeService
     try {
          const account = await StripeService.retrieveAccount(connectedAccount.accountId);

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
                         // Attempt automated disbursement via StripeService
                         try {
                              const transfer = await StripeService.createTransfer(
                                   pendingLoan.principalAmount,
                                   connectedAccount.accountId,
                                   'gbp',
                                   `Automated post-onboarding disbursement for Loan: ${pendingLoan._id}`,
                              );

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

/**
 * Called when the onboarding link expires — generates a fresh link and returns the URL.
 * No userId needed; looks up by Stripe accountId directly.
 */
const refreshLinkByAccountId = async (accountId: string): Promise<string> => {
     const connectedAccount = await StripeConnectedAccount.findOne({ accountId });
     if (!connectedAccount) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Connected account not found');
     }

     const url = await StripeService.createAccountLink(accountId);
     connectedAccount.onboardingUrl = url;
     await connectedAccount.save();

     return url;
};

export const StripeConnectService = {
     onboardAccount,
     getStatus,
     refreshLinkByAccountId,
};
