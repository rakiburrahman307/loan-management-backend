import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { LoanService } from './loan.service';
import pick from '../../../shared/pick';

const createOrSaveDraft = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await LoanService.createOrSaveDraft(userId, req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'Loan application draft saved successfully',
          data: result,
     });
});

const submitApplication = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const { id: applicationId } = req.params;
     const result = await LoanService.submitApplication(userId, applicationId, req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Loan application submitted successfully for review',
          data: result,
     });
});

const getApplications = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await LoanService.getApplications(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Loan applications retrieved successfully',
          data: result,
     });
});

const getActiveLoan = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await LoanService.getActiveLoan(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Active loan details retrieved successfully',
          data: result,
     });
});

const getClientFundingDetails = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await LoanService.getClientFundingDetails(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Client funding overview retrieved successfully',
          data: result,
     });
});

const getClientFundingHistory = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const filters = pick(req.query, ['page', 'limit', 'dateRange', 'searchTerm']);
     const result = await LoanService.getClientFundingHistory(userId, filters);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Client repayment history retrieved successfully',
          data: result.data,
          meta: result.meta,
     });
});

const getLoans = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const queryOptions = pick(req.query, [
          'page',
          'limit',
          'sortBy',
          'sortOrder',
          'searchTerm',
          'status',
          'disbursementStatus',
     ]);
     const result = await LoanService.getLoans(userId, queryOptions);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'All loans retrieved successfully',
          data: result.data,
          meta: result.meta,
     });
});

// Admin Controllers
const adminGetApplications = catchAsync(async (req, res) => {
     const queryOptions = pick(req.query, [
          'page',
          'limit',
          'sortBy',
          'sortOrder',
          'searchTerm',
          'status',
     ]);
     const result = await LoanService.adminGetApplications(queryOptions);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'All loan applications retrieved successfully',
          data: result.data,
          meta: result.meta,
     });
});

const adminGetApplicationsCards = catchAsync(async (req, res) => {
     const result = await LoanService.adminGetApplicationsCards();
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Loan application cards retrieved successfully',
          data: result,
     });
});

const adminGetApplicationById = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await LoanService.adminGetApplicationById(id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Loan application details retrieved successfully',
          data: result,
     });
});

const adminReviewApplication = catchAsync(async (req, res) => {
     const adminId = req.user.id;
     const { id: applicationId } = req.params;
     const result = await LoanService.adminReviewApplication(adminId, applicationId, req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: `Loan application successfully ${req.body.status.toLowerCase()}`,
          data: result,
     });
});

const retryDisbursement = catchAsync(async (req, res) => {
     const { id: loanId } = req.params;
     const result = await LoanService.retryDisbursement(loanId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Loan disbursement retried successfully',
          data: result,
     });
});

export const LoanController = {
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
