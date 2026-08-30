import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import AppError from '../../../errors/AppError';
import stripe from '../../../config/stripe';
import { Payment } from './payment.model';
import { Borrower } from '../borrower/borrower.model';
import { Loan } from '../loan/loan.model';
import { Transaction } from '../transaction/transaction.model';
import { Commission } from '../transaction/commission.model';
import { LoanRepayment } from '../transaction/loanRepayment.model';
import { dispatchMerchantWebhook } from '../../../helpers/merchantWebhookHelper';

const PROCESS_COMMISSION_RATE = 10; // Default 10% platform commission

const handlePaymentSuccess = async (checkoutSessionId: string, paymentIntentId: string, stripeAmount: number, customerEmail?: string) => {
     // Start session for atomic database updates
     // fallback if replica sets are not enabled locally
     const session = await mongoose.startSession().catch(() => null);
     if (session) {
          session.startTransaction();
     }

     try {
          // Find the payment
          const payment = await Payment.findOne({ checkoutSessionId }).session(session as any);
          if (!payment) {
               throw new AppError(StatusCodes.NOT_FOUND, `Payment not found for checkout session: ${checkoutSessionId}`);
          }

          if (payment.status === 'COMPLETED') {
               // Idempotency: already processed
               if (session) await session.endSession();
               return payment;
          }

          const borrower = await Borrower.findById(payment.borrowerId).session(session as any);
          if (!borrower) {
               throw new AppError(StatusCodes.NOT_FOUND, 'Borrower associated with this payment not found.');
          }

          // Fetch the active loan if any
          const activeLoan = await Loan.findOne({
               borrowerId: borrower._id,
               status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
          }).session(session as any);

          const totalAmount = payment.amount; // in minor units (cents/pence)

          // Calculate platform commission
          const commissionAmount = Math.round(totalAmount * (PROCESS_COMMISSION_RATE / 100));

          // Calculate loan repayment
          let repaymentAmount = 0;
          if (activeLoan && activeLoan.outstandingBalance > 0) {
               const rawRepayment = Math.round(totalAmount * (activeLoan.repaymentPercentage / 100));
               // Cap the repayment at the remaining outstanding balance of the loan
               const outstandingInMinorUnits = Math.round(activeLoan.outstandingBalance * 100);
               repaymentAmount = Math.min(rawRepayment, outstandingInMinorUnits);
          }

          // Calculate borrower payout
          const payoutAmount = totalAmount - commissionAmount - repaymentAmount;

          // Convert back to major units for logging
          const totalAmountMajor = totalAmount / 100;
          const commissionAmountMajor = commissionAmount / 100;
          const repaymentAmountMajor = repaymentAmount / 100;
          const payoutAmountMajor = payoutAmount / 100;

          // Trigger Stripe Connected Account transfer for borrower payout
          let stripeTransferId = '';
          if (payoutAmount > 0 && borrower.stripeAccountId) {
               try {
                    // Retrieve Payment Intent to get the latest charge ID (starts with ch_ instead of pi_)
                    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                    const chargeId = typeof paymentIntent.latest_charge === 'string' 
                         ? paymentIntent.latest_charge 
                         : paymentIntentId;

                    const transfer = await stripe.transfers.create({
                         amount: payoutAmount,
                         currency: payment.currency,
                         destination: borrower.stripeAccountId,
                         source_transaction: chargeId,
                         description: `Payout for sale checkout session: ${checkoutSessionId}`,
                    });
                    stripeTransferId = transfer.id;
               } catch (transferError: any) {
                    console.error('Stripe transfer split payout failed:', transferError);
                    // Even if transfer fails, we want to log the failure and throw to rollback transaction
                    throw new AppError(
                         StatusCodes.INTERNAL_SERVER_ERROR,
                         `Failed to route split payout to merchant: ${transferError.message}`,
                    );
               }
          }

          // Update Payment status
          payment.status = 'COMPLETED';
          payment.paymentIntentId = paymentIntentId;
          if (customerEmail) {
               payment.customerEmail = customerEmail;
          }
          await payment.save({ session: session as any });

          // Log Sale Transaction
          await Transaction.create(
               [
                    {
                         borrowerId: borrower._id,
                         paymentId: payment._id,
                         type: 'SALE',
                         amount: totalAmountMajor,
                         currency: payment.currency,
                         status: 'SUCCESS',
                         stripeChargeId: paymentIntentId,
                         description: `General customer purchase of £${totalAmountMajor}`,
                    },
               ],
               { session: session as any },
          );

          // Log Commission record and Transaction
          await Commission.create(
               [
                    {
                         paymentId: payment._id,
                         borrowerId: borrower._id,
                         amount: commissionAmountMajor,
                         rate: PROCESS_COMMISSION_RATE,
                         status: 'SETTLED',
                    },
               ],
               { session: session as any },
          );

          await Transaction.create(
               [
                    {
                         borrowerId: borrower._id,
                         paymentId: payment._id,
                         type: 'COMMISSION',
                         amount: commissionAmountMajor,
                         currency: payment.currency,
                         status: 'SUCCESS',
                         description: `Platform fee commission of £${commissionAmountMajor} (10%)`,
                    },
               ],
               { session: session as any },
          );

          // Log Loan Repayment if any
          if (repaymentAmount > 0 && activeLoan) {
               // Update Loan Outstanding Balance atomically
               activeLoan.repaidAmount += repaymentAmountMajor;
               activeLoan.outstandingBalance -= repaymentAmountMajor;

               if (activeLoan.outstandingBalance <= 0) {
                    activeLoan.outstandingBalance = 0;
                    activeLoan.status = 'PAID';
               } else {
                    activeLoan.status = 'PARTIALLY_REPAID';
               }
               await activeLoan.save({ session: session as any });

               // Create LoanRepayment log
               await LoanRepayment.create(
                    [
                         {
                              loanId: activeLoan._id,
                              paymentId: payment._id,
                              amount: repaymentAmountMajor,
                              date: new Date(),
                         },
                    ],
                    { session: session as any },
               );

               // Create Transaction Repayment log
               await Transaction.create(
                    [
                         {
                              loanId: activeLoan._id,
                              borrowerId: borrower._id,
                              paymentId: payment._id,
                              type: 'REPAYMENT',
                              amount: repaymentAmountMajor,
                              currency: payment.currency,
                              status: 'SUCCESS',
                              description: `Loan deduction repayment of £${repaymentAmountMajor} (${activeLoan.repaymentPercentage}%)`,
                         },
                    ],
                    { session: session as any },
               );
          }

          if (session) {
               await session.commitTransaction();
               await session.endSession();
          }

          // Dispatch B2B webhook callback to merchant store asynchronously
          dispatchMerchantWebhook(borrower.userId.toString(), 'payment.succeeded', {
               checkoutSessionId,
               paymentIntentId,
               amount: totalAmountMajor,
               payoutAmount: payoutAmountMajor,
               commissionAmount: commissionAmountMajor,
               repaymentAmount: repaymentAmountMajor,
               currency: payment.currency,
               status: 'COMPLETED',
               customerEmail: customerEmail || '',
               metadata: payment.metadata || {},
          }).catch((err) => console.error('Failed to dispatch B2B merchant webhook:', err));

          return payment;
     } catch (error) {
          if (session) {
               await session.abortTransaction();
               await session.endSession();
          }
          throw error;
     }
};

export const PaymentSplitService = {
     handlePaymentSuccess,
};
