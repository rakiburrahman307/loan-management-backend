import mongoose from 'mongoose';
import { Borrower } from '../borrower/borrower.model';
import { Loan } from '../loan/loan.model';
import { Transaction } from '../transaction/transaction.model';

/**
 * Payout Cards
 * - nextScheduledPayout: next pending DISBURSEMENT date (tomorrow's date or next business day)
 * - totalPaidOut: sum of all SUCCESS DISBURSEMENT transactions (in £)
 * - availableBalance: total SALE revenue minus REPAYMENT + COMMISSION + DISBURSEMENT = unremitted balance
 * - pendingAmount: sum of PENDING DISBURSEMENT transactions
 */
const getClientPayoutCards = async (userId: string) => {
     const borrower = await Borrower.findOne({ userId: new mongoose.Types.ObjectId(userId) });
     if (!borrower) {
          return {
               nextScheduledPayout: null,
               totalPaidOut: 0,
               availableBalance: 0,
               pendingAmount: 0,
          };
     }

     // Total paid out — SUCCESS DISBURSEMENT
     const paidOutResult = await Transaction.aggregate([
          {
               $match: {
                    borrowerId: borrower._id,
                    type: 'DISBURSEMENT',
                    status: 'SUCCESS',
               },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
     ]);
     const totalPaidOut = paidOutResult[0]?.total || 0;

     // Pending disbursement amount
     const pendingResult = await Transaction.aggregate([
          {
               $match: {
                    borrowerId: borrower._id,
                    type: 'DISBURSEMENT',
                    status: 'PENDING',
               },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
     ]);
     const pendingAmount = pendingResult[0]?.total || 0;

     // Available balance = total SALE - (REPAYMENT + COMMISSION + DISBURSEMENT)
     const salesResult = await Transaction.aggregate([
          {
               $match: {
                    borrowerId: borrower._id,
                    type: 'SALE',
                    status: 'SUCCESS',
               },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
     ]);
     const totalSales = salesResult[0]?.total || 0;

     const deductionsResult = await Transaction.aggregate([
          {
               $match: {
                    borrowerId: borrower._id,
                    type: { $in: ['REPAYMENT', 'COMMISSION', 'DISBURSEMENT'] },
                    status: 'SUCCESS',
               },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
     ]);
     const totalDeductions = deductionsResult[0]?.total || 0;
     const availableBalance = Math.max(0, totalSales - totalDeductions);

     // Next scheduled payout date — find active loan's repayment % to derive batch cycle
     // If there's a pending DISBURSEMENT it is today/tomorrow; otherwise use next business day
     let nextScheduledPayout: Date | null = null;
     const pendingDisbursement = await Transaction.findOne({
          borrowerId: borrower._id,
          type: 'DISBURSEMENT',
          status: 'PENDING',
     }).sort({ createdAt: 1 });

     if (pendingDisbursement) {
          // Use the creation date + 1 day as expected settlement
          const d = new Date((pendingDisbursement as any).createdAt as Date);
          d.setDate(d.getDate() + 1);
          // Skip weekend
          if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Sunday -> Monday
          if (d.getDay() === 6) d.setDate(d.getDate() + 2); // Saturday -> Monday
          nextScheduledPayout = d;
     } else {
          // Next business day from now
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
          if (tomorrow.getDay() === 6) tomorrow.setDate(tomorrow.getDate() + 2);
          nextScheduledPayout = tomorrow;
     }

     // Bank account for display (last 4 digits of account number)
     const bankName = borrower.bankingDetails?.bankName || '';
     const accountNumber = borrower.bankingDetails?.accountNumber || '';
     const accountHolderName = borrower.bankingDetails?.accountHolderName || '';
     const last4 = accountNumber.length >= 4 ? accountNumber.slice(-4) : accountNumber;

     return {
          nextScheduledPayout,
          bankName,
          accountHolderName,
          bankLast4: last4,
          totalPaidOut,
          availableBalance,
          pendingAmount,
     };
};

/**
 * Payout History — paginated list of DISBURSEMENT transactions
 * Supports: page, limit, status (succeeded | pending | failed)
 */
const getClientPayoutHistory = async (
     userId: string,
     filters: { page?: number; limit?: number; status?: string; dateRange?: string } = {},
) => {
     const page = Number(filters.page || 1);
     const limit = Number(filters.limit || 10);
     const skip = (page - 1) * limit;

     const borrower = await Borrower.findOne({ userId: new mongoose.Types.ObjectId(userId) });
     if (!borrower) {
          return {
               meta: { page, limit, total: 0, totalPage: 0 },
               data: [],
          };
     }

     const matchStage: any = {
          borrowerId: borrower._id,
          type: 'DISBURSEMENT',
     };

     if (filters.status) {
          const statusMap: Record<string, string> = {
               succeeded: 'SUCCESS',
               pending: 'PENDING',
               failed: 'FAILED',
          };
          const mapped = statusMap[filters.status.toLowerCase()];
          if (mapped) matchStage.status = mapped;
     }

     if (filters.dateRange) {
          const now = new Date();
          let startDate: Date | null = null;

          if (filters.dateRange === 'last7days') {
               startDate = new Date();
               startDate.setDate(now.getDate() - 7);
          } else if (filters.dateRange === 'last30days') {
               startDate = new Date();
               startDate.setDate(now.getDate() - 30);
          } else if (filters.dateRange === 'last90days') {
               startDate = new Date();
               startDate.setDate(now.getDate() - 90);
          } else if (filters.dateRange === 'thisyear') {
               startDate = new Date(now.getFullYear(), 0, 1);
          }

          if (startDate) {
               matchStage.createdAt = { $gte: startDate };
          }
     }

     const [countResult, rawData] = await Promise.all([
          Transaction.countDocuments(matchStage),
          Transaction.find(matchStage)
               .sort({ createdAt: -1 })
               .skip(skip)
               .limit(limit)
               .populate('loanId', 'applicationId principalAmount')
               .lean(),
     ]);

     const bankName = borrower.bankingDetails?.bankName || '';
     const accountNumber = borrower.bankingDetails?.accountNumber || '';
     const last4 = accountNumber.length >= 4 ? accountNumber.slice(-4) : accountNumber;

     const formattedData = rawData.map((txn: any) => {
          // Build a readable payout ID from stripeTransferId or _id
          let payoutId = `PY-${txn._id.toString().substring(18).toUpperCase()}`;
          if (txn.stripeTransferId && txn.stripeTransferId.length > 3) {
               const raw = txn.stripeTransferId.replace('tr_', '').toUpperCase();
               payoutId = `PY-${raw.substring(0, 8)}`;
          }

          let statusText = 'Processing';
          if (txn.status === 'SUCCESS') statusText = 'Succeeded';
          else if (txn.status === 'FAILED') statusText = 'Failed';
          else if (txn.status === 'PENDING') statusText = 'Processing';

          return {
               _id: txn._id,
               payoutId,
               amount: txn.amount,
               currency: txn.currency || 'gbp',
               date: txn.createdAt,
               status: statusText,
               destinationBank: bankName ? `${bankName} ••••${last4}` : `••••${last4}`,
               description: txn.description || '',
          };
     });

     return {
          meta: {
               page,
               limit,
               total: countResult,
               totalPage: Math.ceil(countResult / limit),
          },
          data: formattedData,
     };
};

export const PayoutService = {
     getClientPayoutCards,
     getClientPayoutHistory,
};
