import { StatusCodes } from 'http-status-codes';

import AppError from '../errors/AppError';
import stripe from '../config/stripe';

// Fetch payment info from the database
const getPaymentInfo = async (paymentIntentId: string) => {
     // const paymentInfo = await PaymentModel.findOne({ paymentIntentId });
     // if (!paymentInfo) {
     //   throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
     // }
     // return paymentInfo;
};

// Get vendor details and ensure they have a Stripe account
const getVendorInfo = async (shopId: string) => {
     // const vendorInfo = await ShopModel.findById(shopId)
     //   .populate({
     //     path: 'userId',
     //     select: 'stripeAccountId',
     //   })
     //   .exec();
     // if (!vendorInfo || !vendorInfo.userId || !vendorInfo.userId.stripeAccountId) {
     //   throw new AppError(StatusCodes.BAD_REQUEST, 'Vendor Stripe account not found');
     // }
     // return vendorInfo;
};

// Calculate the admin fee and remaining amount after the fee is deducted
const calculateAdminFee = async (paymentAmount: number, shopId: string) => {
     // const adminPercentage = await ShopModel.findById(shopId);
     // if (!adminPercentage) {
     //   throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Admin fee percentage not found');
     // }
     // const adminFeeAmount = Math.floor((paymentAmount * adminPercentage.revenue) / 100);
     // const remainingAmount = paymentAmount - adminFeeAmount;
     // return remainingAmount;
};

// Check Stripe balance for available funds
const checkStripeBalance = async (amount: number) => {
     const balance = await stripe.balance.retrieve();
     if (balance.available[0].amount < amount * 100) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               'Insufficient funds in platform account for transfer',
          );
     }
};

// Verify the vendor's Stripe account is active and enabled
const verifyStripeAccount = async (stripeAccountId: string) => {
     const account = await stripe.accounts.retrieve(stripeAccountId);
     if (account.requirements && account.requirements.disabled_reason) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               `Vendor's Stripe account is not enabled: ${account.requirements.disabled_reason}`,
          );
     }
};

// Create the transfer to the vendor's Stripe account
const createTransfer = async (stripeAccountId: string, amount: number) => {
     return stripe.transfers.create({
          amount: Math.floor(amount * 100), // Convert to cents
          currency: 'usd',
          destination: stripeAccountId,
     });
};

// Create payout to vendor's external bank account or card
const createPayout = async (stripeAccountId: string, amount: number) => {
     const externalAccount = await stripe.accounts.listExternalAccounts(stripeAccountId, {
          object: 'bank_account',
     });
     if (!externalAccount.data.length) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               'No external bank accounts found for the vendor',
          );
     }
     return stripe.payouts.create(
          {
               amount: Math.floor(amount * 100), // Convert to cents
               currency: 'usd',
               destination: externalAccount.data[0].id,
               method: 'standard', // Can change to 'instant' for instant payouts
          },
          { stripeAccount: stripeAccountId },
     );
};

// Main function to transfer funds to vendor
const transferToVendor = async (shopId: string, paymentIntentId: string) => {
     try {
          const paymentInfo = await getPaymentInfo(paymentIntentId);
          const vendorInfo = await getVendorInfo(shopId);
          // const remainingAmount = await calculateAdminFee(paymentInfo.totalAmount, shopId);

          // await checkStripeBalance(remainingAmount);
          // await verifyStripeAccount(vendorInfo.userId.stripeAccountId);

          // const transfer = await createTransfer(vendorInfo.userId.stripeAccountId, remainingAmount);
          // const payout = await createPayout(vendorInfo.userId.stripeAccountId, remainingAmount);

          // // Optionally, update payment and order status
          // await PaymentModel.findOneAndUpdate(
          //   { paymentIntentId },
          //   { orderStatus: 'completed' },
          //   { new: true }
          // );
          // await OrderModel.findOneAndUpdate(
          //   { paymentIntentId },
          //   { orderStatus: 'completed' }
          // );

          // Return transfer and payout details
          // return { transfer, payout };
     } catch (error) {
          console.error('Transfer failed:', error);
          throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Transfer failed');
     }
};

export default transferToVendor;
