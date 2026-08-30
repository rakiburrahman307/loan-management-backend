import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import mongoose from 'mongoose';
import AppError from '../../../errors/AppError';
import { Borrower } from './borrower.model';
import { IBorrower } from './borrower.interface';
import { User } from '../user/user.model';
import { Integration } from '../integration/integration.model';
import { Loan } from '../loan/loan.model';
import { LoanApplication } from '../loan/loanApplication.model';
import { Transaction } from '../transaction/transaction.model';
import { LoanRepayment } from '../transaction/loanRepayment.model';

const getProfile = async (userId: string) => {
     let borrower = await Borrower.findOne({ userId });
     if (!borrower) {
          borrower = await Borrower.create({ userId });
     }

     return {
          businessDetails: {
               legalName: borrower.businessDetails?.legalName || '',
               crn: borrower.businessDetails?.crn || '',
               storeUrl: borrower.businessDetails?.storeUrl || '',
               industrySector: borrower.businessDetails?.industrySector || '',
               yearsInBusiness: borrower.businessDetails?.yearsInBusiness || 0,
               registeredAddress: borrower.businessDetails?.registeredAddress || '',
          },
          primaryContact: {
               fullName: borrower.primaryContact?.fullName || '',
               businessEmail: borrower.primaryContact?.businessEmail || '',
               phoneNumber: borrower.primaryContact?.phoneNumber || '',
          },
     };
};

const updateProfile = async (userId: string, payload: any) => {
     let borrower = await Borrower.findOne({ userId });
     if (!borrower) {
          borrower = await Borrower.create({ userId });
     }

     // 1. Update Borrower businessDetails if provided
     if (payload.businessDetails) {
          const cleanBusinessDetails = { ...payload.businessDetails };
          borrower.businessDetails = {
               ...borrower.businessDetails,
               ...cleanBusinessDetails,
          };
     }

     // 2. Update Borrower primaryContact if provided
     if (payload.primaryContact) {
          const cleanPrimaryContact = { ...payload.primaryContact };
          borrower.primaryContact = {
               ...borrower.primaryContact,
               ...cleanPrimaryContact,
          };
     }

     await borrower.save();

     return getProfile(userId);
};

const generateAPIKeys = async (userId: string, storeUrl?: string, webhookUrl?: string) => {
     // Generate secure API key and Webhook Secret
     const rawApiKey = 'lm_live_' + crypto.randomBytes(24).toString('hex');
     const hashedApiKey = crypto.createHash('sha256').update(rawApiKey).digest('hex');
     const apiKeyPreview = `${rawApiKey.substring(0, 12)}...${rawApiKey.slice(-4)}`;
     const webhookSecret = 'whsec_' + crypto.randomBytes(24).toString('hex');

     let integration = await Integration.findOne({ userId });
     if (integration) {
          integration.apiKey = hashedApiKey;
          integration.apiKeyPreview = apiKeyPreview;
          integration.webhookSecret = webhookSecret;
          if (storeUrl) {
               integration.storeUrl = storeUrl;
          }
          if (webhookUrl) {
               integration.webhookUrl = webhookUrl;
          }
          await integration.save();
     } else {
          integration = await Integration.create({
               userId,
               apiKey: hashedApiKey,
               apiKeyPreview,
               webhookSecret,
               storeUrl: storeUrl || '',
               webhookUrl: webhookUrl || '',
               isActive: true,
          });
     }

     // Return the raw API key to the borrower once, as it won't be visible again
     return {
          apiKey: rawApiKey,
          apiKeyPreview,
          webhookSecret,
          storeUrl: integration.storeUrl,
          webhookUrl: integration.webhookUrl,
     };
};

const getIntegration = async (userId: string) => {
     const integration = await Integration.findOne({ userId });
     if (!integration) {
          throw new AppError(
               StatusCodes.NOT_FOUND,
               'API Integration credentials not found. Please generate them.',
          );
     }
     return integration;
};

// Admin Service methods
const adminGetBorrowers = async (
     filters: {
          page?: number;
          limit?: number;
          sortBy?: string;
          sortOrder?: string;
          searchTerm?: string;
          status?: string;
     } = {},
) => {
     const page = Number(filters.page || 1);
     const limit = Number(filters.limit || 10);
     const skip = (page - 1) * limit;

     const sortBy = filters.sortBy || 'createdAt';
     const sortOrder = filters.sortOrder || 'desc';
     const sortConditions: any = {};
     sortConditions[sortBy] = sortOrder;

     const query: any = {};

     if (filters.searchTerm) {
          const searchRegex = new RegExp(filters.searchTerm, 'i');
          query.$or = [
               { 'businessDetails.legalName': searchRegex },
               { 'businessDetails.industrySector': searchRegex },
          ];
     }

     if (filters.status) {
          const statusLower = filters.status.toLowerCase();
          if (statusLower === 'active') {
               const activeBorrowerIds = await Loan.distinct('borrowerId', {
                    status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
               });
               query._id = { $in: activeBorrowerIds };
          } else if (statusLower === 'pending review') {
               const pendingBorrowerIds = await LoanApplication.distinct('borrowerId', {
                    status: 'PENDING',
               });
               query._id = { $in: pendingBorrowerIds };
          } else if (statusLower === 'inactive') {
               const activeIds = await Loan.distinct('borrowerId', {
                    status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
               });
               const pendingIds = await LoanApplication.distinct('borrowerId', {
                    status: 'PENDING',
               });
               query._id = { $nin: [...activeIds, ...pendingIds] };
          }
     }

     if ((filters as any).dateRange) {
          const dateRangeOption = (filters as any).dateRange;
          const now = new Date();
          let startDate: Date | null = null;

          if (dateRangeOption === 'last7days') {
               startDate = new Date();
               startDate.setDate(now.getDate() - 7);
          } else if (dateRangeOption === 'last30days') {
               startDate = new Date();
               startDate.setDate(now.getDate() - 30);
          } else if (dateRangeOption === 'last90days') {
               startDate = new Date();
               startDate.setDate(now.getDate() - 90);
          } else if (dateRangeOption === 'thisyear') {
               startDate = new Date(now.getFullYear(), 0, 1);
          }

          if (startDate) {
               query.createdAt = { $gte: startDate };
          }
     }

     const total = await Borrower.countDocuments(query);
     const totalPage = Math.ceil(total / limit);

     const borrowers = await Borrower.find(query)
          .sort(sortConditions)
          .skip(skip)
          .limit(limit)
          .populate({
               path: 'userId',
               select: 'name email status',
          });

     const data = [];
     for (const borrower of borrowers) {
          // Find active loan if any
          const activeLoan = await Loan.findOne({
               borrowerId: borrower._id,
               status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
          });

          // Determine status
          let status = 'Inactive';
          if (activeLoan) {
               status = 'Active';
          } else {
               // Check if they have a pending application
               const pendingApp = await LoanApplication.findOne({
                    borrowerId: borrower._id,
                    status: 'PENDING',
               });
               if (pendingApp) {
                    status = 'Pending Review';
               }
          }

          const progressPercent =
               activeLoan && activeLoan.totalRepayableAmount > 0
                    ? Math.round((activeLoan.repaidAmount / activeLoan.totalRepayableAmount) * 100)
                    : 0;

          data.push({
               _id: borrower._id,
               businessDetails: borrower.businessDetails,
               financials: borrower.financials,
               bankingDetails: borrower.bankingDetails,
               documents: borrower.documents,
               userId: borrower.userId,
               stripeAccountId: borrower.stripeAccountId,
               stripeOnboardingComplete: borrower.stripeOnboardingComplete,
               loanDetails: activeLoan
                    ? {
                           totalFunding: activeLoan.principalAmount,
                           outstanding: activeLoan.outstandingBalance,
                           repaymentPercentage: activeLoan.repaymentPercentage,
                           repaymentProgress: progressPercent,
                      }
                    : {
                           totalFunding: 0,
                           outstanding: 0,
                           repaymentPercentage: 0,
                           repaymentProgress: 0,
                      },
               status,
          });
     }

     return {
          meta: {
               page,
               limit,
               total,
               totalPage,
          },
          data,
     };
};

const adminGetBorrowersCards = async () => {
     // Active Borrowers: distinct borrowerId of all active/partially repaid loans
     const activeBorrowers = await Loan.distinct('borrowerId', {
          status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
     });
     const activeBorrowersCount = activeBorrowers.length;

     // Avg. Repayment Rate: average repaymentPercentage of active/partially repaid loans
     const avgRepaymentResult = await Loan.aggregate([
          { $match: { status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] } } },
          { $group: { _id: null, avgRate: { $avg: '$repaymentPercentage' } } },
     ]);
     const avgRepaymentRate = avgRepaymentResult[0]?.avgRate || 0;

     // Total Portfolio Value: sum of outstandingBalance of active/partially repaid loans
     const totalPortfolioResult = await Loan.aggregate([
          { $match: { status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] } } },
          { $group: { _id: null, totalOutstanding: { $sum: '$outstandingBalance' } } },
     ]);
     const totalPortfolioValue = totalPortfolioResult[0]?.totalOutstanding || 0;

     return {
          activeBorrowers: activeBorrowersCount,
          avgRepaymentRate,
          totalPortfolioValue,
     };
};

const adminGetBorrowerById = async (
     id: string,
     queryOptions: { page?: number; limit?: number } = {},
) => {
     const page = Number(queryOptions.page || 1);
     const limit = Number(queryOptions.limit || 10);
     const skip = (page - 1) * limit;

     const borrower = await Borrower.findById(id).populate({
          path: 'userId',
          select: 'name email status createdAt',
     });

     if (!borrower) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Borrower profile not found');
     }

     const activeLoan = await Loan.findOne({
          borrowerId: borrower._id,
          status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
     });

     let loanProgress = {
          totalPaid: 0,
          remainingAmount: 0,
          percentRepaid: 0,
          avgMonthlyPayment: 0,
          disbursedDate: null as Date | null,
          repaymentRate: 0,
          principalAmount: 0,
     };

     if (activeLoan) {
          const monthlyAvgResult = await LoanRepayment.aggregate([
               { $match: { loanId: activeLoan._id } },
               {
                    $group: {
                         _id: {
                              month: { $month: '$createdAt' },
                              year: { $year: '$createdAt' },
                         },
                         total: { $sum: '$amount' },
                    },
               },
               {
                    $group: {
                         _id: null,
                         avgPayment: { $avg: '$total' },
                    },
               },
          ]);
          const avgMonthlyPayment = monthlyAvgResult[0]?.avgPayment || 0;

          const percentRepaid =
               activeLoan.totalRepayableAmount > 0
                    ? Math.round((activeLoan.repaidAmount / activeLoan.totalRepayableAmount) * 100)
                    : 0;

          loanProgress = {
               totalPaid: activeLoan.repaidAmount,
               remainingAmount: activeLoan.outstandingBalance,
               percentRepaid,
               avgMonthlyPayment,
               disbursedDate: activeLoan.activatedAt,
               repaymentRate: activeLoan.repaymentPercentage,
               principalAmount: activeLoan.principalAmount,
          };
     }

     // Aggregate monthly trend chart (last 6 months) for this borrower
     const sixMonthsAgo = new Date();
     sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
     sixMonthsAgo.setDate(1);
     sixMonthsAgo.setHours(0, 0, 0, 0);

     const chartDataResult = await Transaction.aggregate([
          {
               $match: {
                    borrowerId: borrower._id,
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
          revenue: number;
          repayment: number;
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
               revenue: 0,
               repayment: 0,
          });
     }

     chartDataResult.forEach((item: any) => {
          const match = months.find(
               (m) => m.monthNum === item._id.month && m.year === item._id.year,
          );
          if (match) {
               if (item._id.type === 'DISBURSEMENT') {
                    match.revenue = item.total;
               } else if (item._id.type === 'REPAYMENT') {
                    match.repayment = item.total;
               }
          }
     });

     const trendChart = months.map((m) => ({
          month: `${m.month} ${m.year}`,
          revenue: m.revenue,
          repayment: m.repayment,
     }));

     // Paginated list of repayments/transactions of type 'REPAYMENT'
     const repaymentsQuery = {
          borrowerId: borrower._id,
          type: 'REPAYMENT',
     };
     const totalRepayments = await Transaction.countDocuments(repaymentsQuery);
     const totalPages = Math.ceil(totalRepayments / limit);

     const repayments = await Transaction.find(repaymentsQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

     return {
          borrower,
          loanProgress,
          trendChart,
          repaymentTransactions: {
               meta: {
                    page,
                    limit,
                    total: totalRepayments,
                    totalPage: totalPages,
               },
               data: repayments,
          },
     };
};

export const BorrowerService = {
     getProfile,
     updateProfile,
     generateAPIKeys,
     getIntegration,
     adminGetBorrowers,
     adminGetBorrowersCards,
     adminGetBorrowerById,
};
