import mongoose from 'mongoose';
import { Transaction } from './transaction.model';
import { Borrower } from '../borrower/borrower.model';
import { Payment } from '../payment/payment.model';

const getAdminTransactions = async (filters: {
     page?: number;
     limit?: number;
     status?: string;
     searchTerm?: string;
} = {}) => {
     const page = Number(filters.page || 1);
     const limit = Number(filters.limit || 15);
     const skip = (page - 1) * limit;

     const pipeline: any[] = [];

     // Match conditions
     const matchStage: any = {};
     if (filters.status) {
          const statusMap: Record<string, string> = {
               succeeded: 'SUCCESS',
               pending: 'PENDING',
               failed: 'FAILED',
          };
          const mappedStatus = statusMap[filters.status.toLowerCase()];
          if (mappedStatus) {
               matchStage.status = mappedStatus;
          }
     }

     if (filters.searchTerm) {
          const searchRegex = new RegExp(filters.searchTerm, 'i');
          const matchingBorrowers = await Borrower.find({
               'businessDetails.legalName': searchRegex,
          }).select('_id');
          matchStage.borrowerId = { $in: matchingBorrowers.map((b) => b._id) };
     }

     if (Object.keys(matchStage).length > 0) {
          pipeline.push({ $match: matchStage });
     }

     // Group by paymentId, or by _id if paymentId is missing
     pipeline.push({
          $group: {
               _id: {
                    $cond: {
                         if: { $and: [{ $gt: ['$paymentId', null] }] },
                         then: '$paymentId',
                         else: '$_id',
                    },
               },
               type: { $first: '$type' },
               status: { $first: '$status' },
               createdAt: { $max: '$createdAt' },
               borrowerId: { $first: '$borrowerId' },
               stripeChargeId: { $first: '$stripeChargeId' },
               stripeTransferId: { $first: '$stripeTransferId' },
               grossAmount: {
                    $sum: {
                         $cond: [{ $eq: ['$type', 'SALE'] }, '$amount', 0],
                    },
               },
               repaymentAmount: {
                    $sum: {
                         $cond: [{ $eq: ['$type', 'REPAYMENT'] }, '$amount', 0],
                    },
               },
               commissionAmount: {
                    $sum: {
                         $cond: [{ $eq: ['$type', 'COMMISSION'] }, '$amount', 0],
                    },
               },
               disbursementAmount: {
                    $sum: {
                         $cond: [{ $eq: ['$type', 'DISBURSEMENT'] }, '$amount', 0],
                    },
               },
          },
     });

     // Sort by createdAt descending
     pipeline.push({ $sort: { createdAt: -1 } });

     // Paginate using facet
     pipeline.push({
          $facet: {
               metadata: [{ $count: 'total' }],
               data: [{ $skip: skip }, { $limit: limit }],
          },
     });

     const result = await Transaction.aggregate(pipeline);
     const total = result[0]?.metadata[0]?.total || 0;
     const rawData = result[0]?.data || [];

     const populatedData = (await Borrower.populate(rawData, {
          path: 'borrowerId',
          populate: { path: 'userId', select: 'name email status image' },
     })) as unknown as any[];

     const formattedData = populatedData.map((row: any) => {
          const isSale = row.type === 'SALE' || row.grossAmount > 0;
          const gross = isSale ? row.grossAmount : row.disbursementAmount;
          const repayment = isSale ? row.repaymentAmount : 0;
          const commission = isSale ? row.commissionAmount : 0;
          const netPayout = isSale ? (gross - repayment - commission) : gross;

          let statusText = 'Pending';
          if (row.status === 'SUCCESS') {
               statusText = 'Succeeded';
          } else if (row.status === 'FAILED') {
               statusText = 'Failed';
          }

          let transactionIdLabel = `#TRX-${row._id.toString().substring(18).toUpperCase()}`;
          if (row.stripeChargeId) {
               transactionIdLabel = `#TRX-${row.stripeChargeId.substring(3, 11).toUpperCase()}`;
          } else if (row.stripeTransferId) {
               transactionIdLabel = `#TRX-${row.stripeTransferId.substring(3, 11).toUpperCase()}`;
          }

          return {
               _id: row._id,
               createdAt: row.createdAt,
               transactionId: transactionIdLabel,
               type: row.type,
               business: {
                    name: row.borrowerId?.businessDetails?.legalName || 'N/A',
                    logo: row.borrowerId?.image || '',
                    address: row.borrowerId?.businessDetails?.registeredAddress || '',
               },
               grossAmount: gross,
               repayment: repayment,
               netPayout: netPayout,
               status: statusText,
          };
     });


     return {
          meta: {
               page,
               limit,
               total,
               totalPage: Math.ceil(total / limit),
          },
          data: formattedData,
     };
};

const getClientTransactionCards = async (userId: string) => {
     const borrower = await Borrower.findOne({ userId: new mongoose.Types.ObjectId(userId) });
     if (!borrower) {
          return {
               totalProcessedSales: 0,
               totalRepaidToDate: 0,
               dailyRepaymentAvg: 0,
               pendingSettlements: 0,
          };
     }

     const totalSalesResult = await Payment.aggregate([
          { $match: { borrowerId: borrower._id, status: 'COMPLETED' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
     ]);
     const totalProcessedSales = (totalSalesResult[0]?.total || 0) / 100;

     const totalRepaidResult = await Transaction.aggregate([
          { $match: { borrowerId: borrower._id, type: 'REPAYMENT', status: 'SUCCESS' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
     ]);
     const totalRepaidToDate = totalRepaidResult[0]?.total || 0;

     const dailyRepaymentAvgResult = await Transaction.aggregate([
          { $match: { borrowerId: borrower._id, type: 'REPAYMENT', status: 'SUCCESS' } },
          {
               $group: {
                    _id: {
                         year: { $year: '$createdAt' },
                         month: { $month: '$createdAt' },
                         day: { $dayOfMonth: '$createdAt' },
                    },
                    dailyTotal: { $sum: '$amount' },
               },
          },
          {
               $group: {
                    _id: null,
                    avgDailyRepayment: { $avg: '$dailyTotal' },
               },
          },
     ]);
     const dailyRepaymentAvg = dailyRepaymentAvgResult[0]?.avgDailyRepayment || 0;

     const pendingSettlementsResult = await Payment.aggregate([
          { $match: { borrowerId: borrower._id, status: 'PENDING' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
     ]);
     const pendingSettlements = (pendingSettlementsResult[0]?.total || 0) / 100;

     return {
          totalProcessedSales,
          totalRepaidToDate,
          dailyRepaymentAvg,
          pendingSettlements,
     };
};

const getClientTransactions = async (
     userId: string,
     filters: { page?: number; limit?: number; status?: string; dateRange?: string } = {},
) => {
     const page = Number(filters.page || 1);
     const limit = Number(filters.limit || 15);
     const skip = (page - 1) * limit;

     const borrower = await Borrower.findOne({ userId: new mongoose.Types.ObjectId(userId) });
     if (!borrower) {
          return {
               meta: { page, limit, total: 0, totalPage: 0 },
               data: [],
          };
     }

     const pipeline: any[] = [];
     const matchStage: any = { borrowerId: borrower._id };

     if (filters.status) {
          const statusMap: Record<string, string> = {
               succeeded: 'SUCCESS',
               pending: 'PENDING',
               failed: 'FAILED',
          };
          const mappedStatus = statusMap[filters.status.toLowerCase()];
          if (mappedStatus) {
               matchStage.status = mappedStatus;
          }
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

     pipeline.push({ $match: matchStage });

     pipeline.push({
          $group: {
               _id: {
                    $cond: {
                         if: { $and: [{ $gt: ['$paymentId', null] }] },
                         then: '$paymentId',
                         else: '$_id',
                    },
               },
               type: { $first: '$type' },
               status: { $first: '$status' },
               createdAt: { $max: '$createdAt' },
               stripeChargeId: { $first: '$stripeChargeId' },
               stripeTransferId: { $first: '$stripeTransferId' },
               grossAmount: {
                    $sum: {
                         $cond: [{ $eq: ['$type', 'SALE'] }, '$amount', 0],
                    },
               },
               repaymentAmount: {
                    $sum: {
                         $cond: [{ $eq: ['$type', 'REPAYMENT'] }, '$amount', 0],
                    },
               },
               commissionAmount: {
                    $sum: {
                         $cond: [{ $eq: ['$type', 'COMMISSION'] }, '$amount', 0],
                    },
               },
               disbursementAmount: {
                    $sum: {
                         $cond: [{ $eq: ['$type', 'DISBURSEMENT'] }, '$amount', 0],
                    },
               },
          },
     });

     pipeline.push({ $sort: { createdAt: -1 } });

     pipeline.push({
          $facet: {
               metadata: [{ $count: 'total' }],
               data: [{ $skip: skip }, { $limit: limit }],
          },
     });

     const result = await Transaction.aggregate(pipeline);
     const total = result[0]?.metadata[0]?.total || 0;
     const rawData = result[0]?.data || [];

     const formattedData = rawData.map((row: any) => {
          const isSale = row.type === 'SALE' || row.grossAmount > 0;
          const gross = isSale ? row.grossAmount : row.disbursementAmount;
          const repayment = isSale ? row.repaymentAmount : 0;
          const commission = isSale ? row.commissionAmount : 0;
          const netPayout = isSale ? (gross - repayment - commission) : gross;

          let statusText = 'Pending';
          if (row.status === 'SUCCESS') {
               statusText = 'Succeeded';
          } else if (row.status === 'FAILED') {
               statusText = 'Failed';
          }

          let transactionIdLabel = `#TRX-${row._id.toString().substring(18).toUpperCase()}`;
          if (row.stripeChargeId) {
               transactionIdLabel = `#TRX-${row.stripeChargeId.substring(3, 11).toUpperCase()}`;
          } else if (row.stripeTransferId) {
               transactionIdLabel = `#TRX-${row.stripeTransferId.substring(3, 11).toUpperCase()}`;
          }

          return {
               _id: row._id,
               createdAt: row.createdAt,
               transactionId: transactionIdLabel,
               type: row.type,
               grossAmount: gross,
               repayment: repayment,
               netPayout: netPayout,
               status: statusText,
          };
     });

     return {
          meta: {
               page,
               limit,
               total,
               totalPage: Math.ceil(total / limit),
          },
          data: formattedData,
     };
};

export const TransactionService = {
     getAdminTransactions,
     getClientTransactions,
     getClientTransactionCards,
};
