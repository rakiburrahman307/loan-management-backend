import mongoose from 'mongoose';
import { Borrower } from '../borrower/borrower.model';
import { Loan } from '../loan/loan.model';
import { LoanApplication } from '../loan/loanApplication.model';
import { Payment } from '../payment/payment.model';
import { Transaction } from '../transaction/transaction.model';
import { LoanRepayment } from '../transaction/loanRepayment.model';
import stripe from '../../../config/stripe';

const getAdminOverviewCards = async () => {
     const totalBorrowers = await Borrower.countDocuments();

     const activeLoansCount = await Loan.countDocuments({
          status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
     });

     const totalVolumeResult = await Loan.aggregate([
          { $group: { _id: null, total: { $sum: '$principalAmount' } } },
     ]);
     const totalLoanAmount = totalVolumeResult[0]?.total || 0;

     const pendingApplicationsCount = await LoanApplication.countDocuments({
          status: 'PENDING',
     });

     return {
          totalBorrowers,
          pendingApplications: pendingApplicationsCount,
          activeLoans: activeLoansCount,
          totalLoanAmount,
     };
};

const getAdminFundingVsRepaymentsChart = async () => {
     // Calculate chart data (Funding vs. Repayments for the last 6 months)
     const sixMonthsAgo = new Date();
     sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
     sixMonthsAgo.setDate(1);
     sixMonthsAgo.setHours(0, 0, 0, 0);

     const chartDataResult = await Transaction.aggregate([
          {
               $match: {
                    status: 'COMPLETED',
                    type: { $in: ['DISBURSEMENT', 'REPAYMENT'] },
                    createdAt: { $gte: sixMonthsAgo },
               },
          },
          {
               $group: {
                    _id: {
                         month: { $month: '$createdAt' },
                         year: { $year: '$createdAt' },
                         type: '$type',
                    },
                    total: { $sum: '$amount' },
               },
          },
     ]);

     const months: Array<{
          month: string;
          year: number;
          monthNum: number;
          funding: number;
          repayments: number;
     }> = [];
     const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
     ];

     for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          months.push({
               month: monthNames[d.getMonth()],
               year: d.getFullYear(),
               monthNum: d.getMonth() + 1,
               funding: 0,
               repayments: 0,
          });
     }

     chartDataResult.forEach((item: any) => {
          const match = months.find(
               (m) => m.monthNum === item._id.month && m.year === item._id.year,
          );
          if (match) {
               if (item._id.type === 'DISBURSEMENT') {
                    match.funding = item.total;
               } else if (item._id.type === 'REPAYMENT') {
                    match.repayments = item.total;
               }
          }
     });

     const fundingVsRepaymentsChart = months.map((m) => ({
          month: `${m.month} ${m.year}`,
          funding: m.funding,
          repayments: m.repayments,
     }));

     return fundingVsRepaymentsChart;
};

const getAdminRecentApplications = async () => {
     // Fetch 5 most recent applications for overview table
     const recentApplications = await LoanApplication.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate({
               path: 'borrowerId',
               populate: { path: 'userId', select: 'name email status' },
          });

     return recentApplications;
};

const getClientOverviewCards = async (userId: string) => {
     const borrower = await Borrower.findOne({ userId: new mongoose.Types.ObjectId(userId) });
     if (!borrower) {
          return {
               approvedLoan: 0,
               outstandingBalance: 0,
               totalRepaid: 0,
               repaymentRate: 0,
          };
     }

     const activeLoan = await Loan.findOne({
          borrowerId: borrower._id,
          status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
     });

     if (!activeLoan) {
          return {
               approvedLoan: 0,
               outstandingBalance: 0,
               totalRepaid: 0,
               repaymentRate: 0,
          };
     }

     return {
          approvedLoan: activeLoan.principalAmount,
          outstandingBalance: activeLoan.outstandingBalance,
          totalRepaid: activeLoan.repaidAmount,
          repaymentRate: activeLoan.repaymentPercentage,
     };
};

const getClientRepaymentProgress = async (userId: string) => {
     const borrower = await Borrower.findOne({ userId: new mongoose.Types.ObjectId(userId) });
     if (!borrower) {
          return {
               percentCleared: 0,
               amountPaid: 0,
               amountTotal: 0,
          };
     }

     const activeLoan = await Loan.findOne({
          borrowerId: borrower._id,
          status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
     });

     if (!activeLoan) {
          return {
               percentCleared: 0,
               amountPaid: 0,
               amountTotal: 0,
          };
     }

     const percentCleared = activeLoan.totalRepayableAmount > 0
          ? Math.round((activeLoan.repaidAmount / activeLoan.totalRepayableAmount) * 100)
          : 0;

     return {
          percentCleared,
          amountPaid: activeLoan.repaidAmount,
          amountTotal: activeLoan.totalRepayableAmount,
     };
};

const getClientSalesVsRepaymentChart = async (userId: string) => {
     const borrower = await Borrower.findOne({ userId: new mongoose.Types.ObjectId(userId) });
     if (!borrower) {
          return [];
     }

     const activeLoan = await Loan.findOne({
          borrowerId: borrower._id,
          status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
     });

     const thirtyDaysAgo = new Date();
     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
     thirtyDaysAgo.setHours(0, 0, 0, 0);

     const paymentsResult = await Payment.aggregate([
          {
               $match: {
                    borrowerId: borrower._id,
                    status: 'COMPLETED',
                    createdAt: { $gte: thirtyDaysAgo },
               },
          },
          {
               $group: {
                    _id: {
                         day: { $dayOfMonth: '$createdAt' },
                         month: { $month: '$createdAt' },
                         year: { $year: '$createdAt' },
                    },
                    totalSales: { $sum: '$amount' },
               },
          },
     ]);

     let repaymentsResult: any[] = [];
     if (activeLoan) {
          repaymentsResult = await LoanRepayment.aggregate([
               {
                    $match: {
                         loanId: activeLoan._id,
                         createdAt: { $gte: thirtyDaysAgo },
                    },
               },
               {
                    $group: {
                         _id: {
                              day: { $dayOfMonth: '$createdAt' },
                              month: { $month: '$createdAt' },
                              year: { $year: '$createdAt' },
                         },
                         totalRepayments: { $sum: '$amount' },
                    },
               },
          ]);
     }

     const days: Array<{
          date: string;
          dayNum: number;
          monthNum: number;
          year: number;
          sales: number;
          repayments: number;
     }> = [];
     const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
     ];

     for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days.push({
               date: `${d.getDate()} ${monthNames[d.getMonth()]}`,
               dayNum: d.getDate(),
               monthNum: d.getMonth() + 1,
               year: d.getFullYear(),
               sales: 0,
               repayments: 0,
          });
     }

     paymentsResult.forEach((item: any) => {
          const match = days.find(
               (day) =>
                    day.dayNum === item._id.day &&
                    day.monthNum === item._id.month &&
                    day.year === item._id.year,
          );
          if (match) {
               match.sales = item.totalSales / 100;
          }
     });

     repaymentsResult.forEach((item: any) => {
          const match = days.find(
               (day) =>
                    day.dayNum === item._id.day &&
                    day.monthNum === item._id.month &&
                    day.year === item._id.year,
          );
          if (match) {
               match.repayments = item.totalRepayments / 100;
          }
     });

     return days.map((d) => ({
          date: d.date,
          sales: d.sales,
          repayments: d.repayments,
     }));
};

const getClientRecentTransactions = async (userId: string) => {
     const borrower = await Borrower.findOne({ userId: new mongoose.Types.ObjectId(userId) });
     if (!borrower) {
          return [];
     }

     const payments = await Payment.find({ borrowerId: borrower._id, status: 'COMPLETED' })
          .sort({ createdAt: -1 })
          .limit(5) as any[];

     const recentTransactions = [];
     for (const p of payments) {
          const repayment = await LoanRepayment.findOne({ paymentId: p._id });
          const repaymentAmount = repayment ? repayment.amount : 0;
          const commissionAmount = Math.round(p.amount * 0.1);
          const payoutAmount = p.amount - commissionAmount - repaymentAmount;

          recentTransactions.push({
               transactionId: p.paymentIntentId,
               createdAt: p.createdAt,
               grossSales: p.amount / 100,
               repayment: repaymentAmount / 100,
               netPayout: payoutAmount / 100,
               status: 'Completed',
          });
     }

     return recentTransactions;
};

export const DashboardService = {
     getAdminOverviewCards,
     getAdminFundingVsRepaymentsChart,
     getAdminRecentApplications,
     getClientOverviewCards,
     getClientRepaymentProgress,
     getClientSalesVsRepaymentChart,
     getClientRecentTransactions,
};
