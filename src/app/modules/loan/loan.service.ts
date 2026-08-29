import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { Borrower } from '../borrower/borrower.model';
import { LoanApplication } from './loanApplication.model';
import { Loan } from './loan.model';
import { Transaction } from '../transaction/transaction.model';
import { LoanRepayment } from '../transaction/loanRepayment.model';
import { Payment } from '../payment/payment.model';
import stripe from '../../../config/stripe';
import mongoose from 'mongoose';

const getPlainDocs = (modelObj: any) => {
     if (!modelObj) return {};
     return modelObj.documents
          ? typeof modelObj.documents.toObject === 'function'
               ? modelObj.documents.toObject()
               : modelObj.documents
          : {};
};

const mergeDocuments = (payload: any, existingObj?: any) => {
     const existingDocs = getPlainDocs(existingObj);
     const docs: any = { ...existingDocs };

     const assignValid = (key: string, val: any) => {
          if (val && val !== 'null' && val !== 'undefined') {
               docs[key] = val;
          }
     };

     // Group from root payload (from fileUploadHandler/parseFileData)
     assignValid('certificateOfIncorporation', payload.certificateOfIncorporation);
     assignValid('ownersPhotoId', payload.ownersPhotoId);
     if (
          payload.bankStatements &&
          Array.isArray(payload.bankStatements) &&
          payload.bankStatements.length > 0
     ) {
          docs.bankStatements = payload.bankStatements;
     }
     if (payload.vatReturns && Array.isArray(payload.vatReturns) && payload.vatReturns.length > 0) {
          docs.vatReturns = payload.vatReturns;
     }

     // Group from payload.documents (if passed inside JSON data)
     if (payload.documents) {
          assignValid('certificateOfIncorporation', payload.documents.certificateOfIncorporation);
          assignValid('ownersPhotoId', payload.documents.ownersPhotoId);
          if (
               payload.documents.bankStatements &&
               Array.isArray(payload.documents.bankStatements) &&
               payload.documents.bankStatements.length > 0
          ) {
               docs.bankStatements = payload.documents.bankStatements;
          }
          if (
               payload.documents.vatReturns &&
               Array.isArray(payload.documents.vatReturns) &&
               payload.documents.vatReturns.length > 0
          ) {
               docs.vatReturns = payload.documents.vatReturns;
          }
     }

     return docs;
};

const createOrSaveDraft = async (userId: string, payload: any) => {
     // Find or create borrower profile
     let borrower = await Borrower.findOne({ userId });
     if (!borrower) {
          borrower = await Borrower.create({ userId });
     }

     // Check if there is already a pending, under_review, or approved loan/application
     const existingActiveApplication = await LoanApplication.findOne({
          borrowerId: borrower._id,
          status: { $in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] },
     });

     const existingActiveLoan = await Loan.findOne({
          borrowerId: borrower._id,
          status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
     });

     if (existingActiveApplication || existingActiveLoan) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               'You already have an active loan or application in progress.',
          );
     }

     // Try to find a current draft application
     let draft = await LoanApplication.findOne({
          borrowerId: borrower._id,
          status: 'DRAFT',
     });

     // Merge documents cleanly into the documents nested object
     const mergedDocs = mergeDocuments(payload, draft || borrower);
     payload.documents = mergedDocs;

     if (draft) {
          // Update the draft
          draft = await LoanApplication.findByIdAndUpdate(
               draft._id,
               { $set: { ...payload, borrowerId: borrower._id } },
               { new: true, runValidators: true },
          );
     } else {
          // Create new draft
          draft = await LoanApplication.create({
               ...payload,
               borrowerId: borrower._id,
               status: 'DRAFT',
          });
     }

     // Also update Borrower profile (sync details from draft)
     const borrowerUpdate: any = {};
     if (payload.businessDetails) {
          borrowerUpdate.businessDetails = {
               ...(borrower.businessDetails || {}),
               ...payload.businessDetails,
          };
     }
     if (payload.financials) {
          borrowerUpdate.financials = {
               ...(borrower.financials || {}),
               ...payload.financials,
          };
     }
     if (payload.bankingDetails) {
          borrowerUpdate.bankingDetails = {
               ...(borrower.bankingDetails || {}),
               ...payload.bankingDetails,
          };
     }
     borrowerUpdate.documents = mergedDocs;

     await Borrower.findByIdAndUpdate(borrower._id, { $set: borrowerUpdate });

     return draft;
};

const submitApplication = async (userId: string, applicationId: string, payload: any) => {
     const borrower = await Borrower.findOne({ userId });
     if (!borrower) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Borrower profile not found');
     }

     const application = await LoanApplication.findOne({
          _id: applicationId,
          borrowerId: borrower._id,
     });

     if (!application) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Loan application not found');
     }

     if (application.status !== 'DRAFT') {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               `Cannot submit application in status: ${application.status}`,
          );
     }

     // Merge payload updates with the existing application record
     const finalBusinessDetails = {
          ...(application.businessDetails || {}),
          ...(payload.businessDetails || {}),
     };
     const finalFinancials = {
          ...(application.financials || {}),
          ...(payload.financials || {}),
     };
     const finalBankingDetails = {
          ...(application.bankingDetails || {}),
          ...(payload.bankingDetails || {}),
     };
     const requestedAmount = payload.requestedAmount || application.requestedAmount;

     // Merge files cleanly
     const mergedDocs = mergeDocuments(payload, application || borrower);

     // Put them back in payload to update the database
     payload.documents = mergedDocs;
     payload.businessDetails = finalBusinessDetails;
     payload.financials = finalFinancials;
     payload.bankingDetails = finalBankingDetails;
     payload.requestedAmount = requestedAmount;

     // Enforce completeness checks on the merged database/request snapshot
     if (!requestedAmount || requestedAmount < 1000 || requestedAmount > 250000) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               'Requested funding amount must be between £1,000 and £250,000.',
          );
     }

     const checkRequired = (obj: any, keys: string[]) => {
          for (const key of keys) {
               if (!obj || obj[key] === undefined || obj[key] === null || obj[key] === '') {
                    return false;
               }
          }
          return true;
     };

     if (
          !checkRequired(finalBusinessDetails, [
               'legalName',
               'crn',
               'storeUrl',
               'industrySector',
               'registeredAddress',
          ])
     ) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'All business details are required.');
     }

     if (finalBusinessDetails.crn.length !== 8) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               'Company Registration Number (CRN) must be exactly 8 digits.',
          );
     }

     if (
          !finalFinancials ||
          !finalFinancials.avgMonthlyRevenue ||
          !finalFinancials.annualTurnover ||
          !finalFinancials.primarySalesChannel ||
          !finalFinancials.monthlySalesVolume
     ) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'All financials details are required.');
     }

     if (
          !checkRequired(finalBankingDetails, [
               'bankName',
               'accountHolderName',
               'sortCode',
               'accountNumber',
          ])
     ) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'All banking details are required.');
     }

     if (!mergedDocs.certificateOfIncorporation || !mergedDocs.ownersPhotoId) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               "Certificate of Incorporation and Owner's Photo ID are required to submit the application.",
          );
     }

     // Save files and sync final details to borrower profile
     const borrowerUpdate = {
          businessDetails: finalBusinessDetails,
          financials: finalFinancials,
          bankingDetails: finalBankingDetails,
          documents: mergedDocs,
     };
     await Borrower.findByIdAndUpdate(borrower._id, { $set: borrowerUpdate });

     // Update application fields and change status to PENDING
     const updated = await LoanApplication.findByIdAndUpdate(
          applicationId,
          {
               $set: {
                    ...payload,
                    status: 'PENDING',
                    submittedAt: new Date(),
               },
          },
          { new: true, runValidators: true },
     );

     return updated;
};

const getApplications = async (userId: string) => {
     const borrower = await Borrower.findOne({ userId: new mongoose.Types.ObjectId(userId) });
     if (!borrower) {
          return [];
     }
     return await LoanApplication.find({ borrowerId: borrower._id });
};

const getActiveLoan = async (userId: string) => {
     const borrower = await Borrower.findOne({ userId: new mongoose.Types.ObjectId(userId) });
     if (!borrower) {
          return null;
     }
     return await Loan.findOne({
          borrowerId: borrower._id,
          status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
     });
};

const getLoans = async (
     userId: string,
     options: {
          page?: number;
          limit?: number;
          sortBy?: string;
          sortOrder?: string;
          searchTerm?: string;
          status?: string;
          disbursementStatus?: string;
     } = {},
) => {
     const borrower = await Borrower.findOne({ userId: new mongoose.Types.ObjectId(userId) });
     if (!borrower) {
          return {
               meta: { page: 1, limit: 10, total: 0, totalPage: 0 },
               data: [],
          };
     }

     const page = Number(options.page || 1);
     const limit = Number(options.limit || 10);
     const skip = (page - 1) * limit;

     const sortBy = options.sortBy || 'createdAt';
     const sortOrder = options.sortOrder || 'desc';
     const sortConditions: any = {};
     sortConditions[sortBy] = sortOrder;

     const query: any = { borrowerId: borrower._id };

     // Search keyword matching
     if (options.searchTerm) {
          const searchRegex = new RegExp(options.searchTerm, 'i');
          query.$or = [
               { status: searchRegex },
               { disbursementStatus: searchRegex },
               { stripeTransferId: searchRegex },
          ];
     }

     // Filter fields
     if (options.status) {
          query.status = options.status;
     }
     if (options.disbursementStatus) {
          query.disbursementStatus = options.disbursementStatus;
     }

     const total = await Loan.countDocuments(query);
     const totalPage = Math.ceil(total / limit);

     const data = await Loan.find(query)
          .sort(sortConditions)
          .skip(skip)
          .limit(limit);

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

// Admin Service methods
const adminGetApplications = async (
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

     const query: any = {
          status: { $ne: 'DRAFT' },
     };

     if (filters.status) {
          if (filters.status !== 'DRAFT') {
               query.status = filters.status;
          }
     }

     if (filters.searchTerm) {
          const searchRegex = new RegExp(filters.searchTerm, 'i');
          query.$or = [
               { status: searchRegex },
               { 'businessDetails.legalName': searchRegex },
               { 'businessDetails.crn': searchRegex },
          ];
     }

     const total = await LoanApplication.countDocuments(query);
     const totalPage = Math.ceil(total / limit);

     const data = await LoanApplication.find(query)
          .sort(sortConditions)
          .skip(skip)
          .limit(limit)
          .populate({
               path: 'borrowerId',
               populate: { path: 'userId', select: 'name email status' },
          });

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

const adminGetApplicationById = async (id: string) => {
     const application = await LoanApplication.findById(id).populate({
          path: 'borrowerId',
          populate: { path: 'userId', select: 'name email status' },
     });
     if (!application) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Loan application not found');
     }

     const applicationObj = application.toObject();
     const creditReview = {
          creditScore: 758,
          rating: 'Good',
          status: 'Passed',
          outstandingDebt: 12450,
          latePayments: 0,
          activeAccounts: 4,
     };

     return {
          ...applicationObj,
          creditReview,
     };
};

const adminGetApplicationsCards = async () => {
     const pendingReview = await LoanApplication.countDocuments({ status: 'PENDING' });
     const approved = await LoanApplication.countDocuments({ status: 'APPROVED' });
     const rejected = await LoanApplication.countDocuments({ status: 'REJECTED' });

     // Calculate total funding volume (sum of principalAmount of all active/paid/partially repaid loans)
     const totalVolumeResult = await Loan.aggregate([
          { $match: { status: { $in: ['ACTIVE', 'PARTIALLY_REPAID', 'PAID'] } } },
          { $group: { _id: null, total: { $sum: '$principalAmount' } } },
     ]);
     const totalFundingVolume = totalVolumeResult[0]?.total || 0;

     return {
          pendingReview,
          approved,
          totalFundingVolume,
          riskRejections: rejected,
     };
};

const adminReviewApplication = async (adminId: string, applicationId: string, reviewData: any) => {
     const application = await LoanApplication.findById(applicationId);
     if (!application) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Loan application not found');
     }

     if (application.status !== 'PENDING' && application.status !== 'UNDER_REVIEW') {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               `Cannot review application in status: ${application.status}`,
          );
     }

     if (reviewData.status === 'REJECTED') {
          application.status = 'REJECTED';
          application.reviewNotes = reviewData.reviewNotes || '';
          application.reviewedBy = adminId as any;
          application.reviewedAt = new Date();
          await application.save();
          return { application };
     }

     if (reviewData.status === 'APPROVED') {
          const approvedAmount = reviewData.approvedAmount || application.requestedAmount;
          const terms = reviewData.approvedTerms;

          if (
               !terms ||
               !terms.durationMonths ||
               !terms.interestRate ||
               !terms.repaymentPercentage
          ) {
               throw new AppError(
                    StatusCodes.BAD_REQUEST,
                    'Approved loan terms (durationMonths, interestRate, repaymentPercentage) are required.',
               );
          }

          application.status = 'APPROVED';
          application.approvedAmount = approvedAmount;
          application.approvedTerms = terms;
          application.reviewNotes = reviewData.reviewNotes || '';
          application.reviewedBy = adminId as any;
          application.reviewedAt = new Date();
          await application.save();

          // Calculate total repayable
          const totalRepayableAmount = approvedAmount + (approvedAmount * terms.interestRate) / 100;

          // Create the active Loan
          const loan = await Loan.create({
               borrowerId: application.borrowerId,
               applicationId: application._id,
               status: 'ACTIVE',
               principalAmount: approvedAmount,
               totalRepayableAmount,
               outstandingBalance: totalRepayableAmount,
               repaymentPercentage: terms.repaymentPercentage,
               disbursementStatus: 'PENDING',
          });

          // Attempt Stripe connected account disbursement
          const borrower = await Borrower.findById(application.borrowerId);
          if (borrower && borrower.stripeAccountId && borrower.stripeOnboardingComplete) {
               try {
                    const transfer = await stripe.transfers.create({
                         amount: Math.floor(approvedAmount * 100), // to cents/pence
                         currency: 'gbp',
                         destination: borrower.stripeAccountId,
                         description: `Disbursement of Loan ID: ${loan._id}`,
                    });

                    loan.disbursementStatus = 'DISBURSED';
                    loan.stripeTransferId = transfer.id;
                    await loan.save();

                    // Log successful disbursement transaction
                    await Transaction.create({
                         loanId: loan._id,
                         borrowerId: borrower._id,
                         type: 'DISBURSEMENT',
                         amount: approvedAmount,
                         status: 'SUCCESS',
                         stripeTransferId: transfer.id,
                         description: `Disbursed loan amount £${approvedAmount} to connected account ${borrower.stripeAccountId}`,
                    });
               } catch (stripeError: any) {
                    console.error('Stripe connect disbursement failed:', stripeError);
                    loan.disbursementStatus = 'FAILED';
                    await loan.save();

                    // Log failed disbursement transaction
                    await Transaction.create({
                         loanId: loan._id,
                         borrowerId: borrower._id,
                         type: 'DISBURSEMENT',
                         amount: approvedAmount,
                         status: 'FAILED',
                         description: `Failed to disburse loan: ${stripeError.message}`,
                    });
               }
          }

          return { application, loan };
     }

     throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid review status.');
};

const retryDisbursement = async (loanId: string) => {
     const loan = await Loan.findById(loanId);
     if (!loan) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Loan not found');
     }

     if (loan.disbursementStatus !== 'FAILED' && loan.disbursementStatus !== 'PENDING') {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               `Loan disbursement status is ${loan.disbursementStatus}. Retry not allowed.`,
          );
     }

     const borrower = await Borrower.findById(loan.borrowerId);
     if (!borrower || !borrower.stripeAccountId || !borrower.stripeOnboardingComplete) {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               'Borrower has not completed Stripe onboarding.',
          );
     }

     try {
          const transfer = await stripe.transfers.create({
               amount: Math.floor(loan.principalAmount * 100),
               currency: 'gbp',
               destination: borrower.stripeAccountId,
               description: `Retry disbursement of Loan ID: ${loan._id}`,
          });

          loan.disbursementStatus = 'DISBURSED';
          loan.stripeTransferId = transfer.id;
          await loan.save();

          await Transaction.create({
               loanId: loan._id,
               borrowerId: borrower._id,
               type: 'DISBURSEMENT',
               amount: loan.principalAmount,
               status: 'SUCCESS',
               stripeTransferId: transfer.id,
               description: `Disbursed loan amount £${loan.principalAmount} to connected account ${borrower.stripeAccountId} (Retry)`,
          });

          return loan;
     } catch (stripeError: any) {
          console.error('Stripe connected account disbursement retry failed:', stripeError);
          await Transaction.create({
               loanId: loan._id,
               borrowerId: borrower._id,
               type: 'DISBURSEMENT',
               amount: loan.principalAmount,
               status: 'FAILED',
               description: `Failed retry to disburse loan: ${stripeError.message}`,
          });
          throw new AppError(
               StatusCodes.INTERNAL_SERVER_ERROR,
               `Stripe Transfer failed: ${stripeError.message}`,
          );
     }
};

const getClientFundingDetails = async (userId: string) => {
     const borrower = await Borrower.findOne({ userId: new mongoose.Types.ObjectId(userId) });
     if (!borrower) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Borrower profile not found');
     }

     const activeLoan = await Loan.findOne({
          borrowerId: borrower._id,
          status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
     });

     if (!activeLoan) {
          return {
               hasActiveLoan: false,
          };
     }

     const percentCleared =
          activeLoan.totalRepayableAmount > 0
               ? Math.round((activeLoan.repaidAmount / activeLoan.totalRepayableAmount) * 100)
               : 0;

     // Weekly Avg calculation
     const timeDiff = Math.max(1, Date.now() - new Date(activeLoan.activatedAt || (activeLoan as any).createdAt).getTime());
     const weeks = timeDiff / (1000 * 60 * 60 * 24 * 7);
     const weeklyAvg = activeLoan.repaidAmount / Math.max(1, weeks);

     // Total Sales Linked
     const salesResult = await Payment.aggregate([
          { $match: { borrowerId: borrower._id, status: 'COMPLETED' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
     ]);
     const totalSalesLinked = (salesResult[0]?.total || 0) / 100;

     // Facility ID format: #OB-XXXXX-LF (using substring of ID)
     const facilityId = `#OB-${activeLoan._id.toString().substring(18).toUpperCase()}-LF`;

     // Remaining balance
     const remainingBalance = activeLoan.outstandingBalance;

     // Repayment this week (last 7 days)
     const oneWeekAgo = new Date();
     oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
     const thisWeekResult = await LoanRepayment.aggregate([
          { $match: { loanId: activeLoan._id, createdAt: { $gte: oneWeekAgo } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
     ]);
     const repaymentThisWeek = thisWeekResult[0]?.total || 0;

     // Destination bank
     const bankName = borrower.bankingDetails?.bankName || '';
     const accountNumber = borrower.bankingDetails?.accountNumber || '';
     const last4 = accountNumber.length >= 4 ? accountNumber.slice(-4) : accountNumber;
     const destinationBank = bankName ? `${bankName} account ****${last4}` : (last4 ? `****${last4}` : 'N/A');

     // Last Repayment
     const lastRepaymentDoc = await LoanRepayment.findOne({ loanId: activeLoan._id }).sort({ createdAt: -1 });
     const lastRepayment = lastRepaymentDoc
          ? {
                 amount: lastRepaymentDoc.amount,
                 date: (lastRepaymentDoc as any).createdAt || lastRepaymentDoc.date,
            }
          : null;

     return {
          hasActiveLoan: true,
          percentCleared,
          amountPaid: activeLoan.repaidAmount,
          amountTotal: activeLoan.totalRepayableAmount,
          initiatedDate: activeLoan.activatedAt || (activeLoan as any).createdAt,
          weeklyAvg,
          totalSalesLinked,
          facilityId,
          remainingBalance,
          repaymentThisWeek,
          repaymentRate: activeLoan.repaymentPercentage,
          loanAmount: activeLoan.principalAmount,
          disbursedDate: activeLoan.activatedAt || (activeLoan as any).createdAt,
          destinationBank,
          lastRepayment,
     };
};

const getClientFundingHistory = async (
     userId: string,
     filters: { page?: number; limit?: number; dateRange?: string; searchTerm?: string } = {},
) => {
     const page = Number(filters.page || 1);
     const limit = Number(filters.limit || 10);
     const skip = (page - 1) * limit;

     const borrower = await Borrower.findOne({ userId: new mongoose.Types.ObjectId(userId) });
     if (!borrower) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Borrower profile not found');
     }

     const activeLoan = await Loan.findOne({
          borrowerId: borrower._id,
          status: { $in: ['ACTIVE', 'PARTIALLY_REPAID'] },
     });

     if (!activeLoan) {
          return {
               meta: { page, limit, total: 0, totalPage: 0 },
               data: [],
          };
     }

     const matchQuery: any = { loanId: activeLoan._id };

     if (filters.searchTerm) {
          const searchRegex = new RegExp(filters.searchTerm, 'i');
          const orConditions: any[] = [];

          // Search associated Payments
          const payments = await Payment.find({
               borrowerId: borrower._id,
               $or: [
                    { customerEmail: searchRegex },
                    { paymentIntentId: searchRegex },
               ]
          }).select('_id');

          const matchedPaymentIds = payments.map(p => p._id);
          if (matchedPaymentIds.length > 0) {
               orConditions.push({ paymentId: { $in: matchedPaymentIds } });
          }

          // Search repayment amount directly if numeric
          const numSearch = Number(filters.searchTerm);
          if (!isNaN(numSearch)) {
               orConditions.push({ amount: numSearch });
          }

          if (orConditions.length > 0) {
               matchQuery.$or = orConditions;
          } else {
               // Force empty array if nothing matched
               matchQuery._id = null;
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
               matchQuery.createdAt = { $gte: startDate };
          }
     }

     const total = await LoanRepayment.countDocuments(matchQuery);
     const repayments = await LoanRepayment.find(matchQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('paymentId')
          .lean();

     const data = repayments.map((rep: any) => ({
          _id: rep._id,
          date: rep.createdAt || rep.date,
          saleAmount: rep.paymentId ? rep.paymentId.amount / 100 : 0,
          repaymentAmount: rep.amount,
          status: 'Processed',
     }));

     return {
          meta: {
               page,
               limit,
               total,
               totalPage: Math.ceil(total / limit),
          },
          data,
     };
};

export const LoanService = {
     createOrSaveDraft,
     submitApplication,
     getApplications,
     getActiveLoan,
     getLoans,
     adminGetApplications,
     adminGetApplicationById,
     adminGetApplicationsCards,
     adminReviewApplication,
     retryDisbursement,
     getClientFundingDetails,
     getClientFundingHistory,
};
