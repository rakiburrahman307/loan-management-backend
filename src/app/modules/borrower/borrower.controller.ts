import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { BorrowerService } from './borrower.service';
import { Borrower } from './borrower.model';
import AppError from '../../../errors/AppError';
import pick from '../../../shared/pick';

const getProfile = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await BorrowerService.getProfile(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Borrower profile retrieved successfully',
          data: result,
     });
});

const updateProfile = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await BorrowerService.updateProfile(userId, req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Borrower profile updated successfully',
          data: result,
     });
});

const generateAPIKeys = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const { storeUrl, webhookUrl } = req.body;
     const result = await BorrowerService.generateAPIKeys(userId, storeUrl, webhookUrl);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: 'B2B API Integration Key and Webhook Secret generated successfully. Keep the API key safe!',
          data: result,
     });
});

const getIntegration = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await BorrowerService.getIntegration(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'API Integration details retrieved successfully',
          data: result,
     });
});

// Admin Controllers
const adminGetBorrowers = catchAsync(async (req, res) => {
     const filters = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder', 'searchTerm', 'status', 'dateRange']);
     const result = await BorrowerService.adminGetBorrowers(filters);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'All registered borrowers retrieved successfully',
          data: result.data,
          meta: result.meta,
     });
});

const adminGetBorrowersCards = catchAsync(async (req, res) => {
     const result = await BorrowerService.adminGetBorrowersCards();
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Borrower overview cards retrieved successfully',
          data: result,
     });
});

const adminGetBorrowerById = catchAsync(async (req, res) => {
     const { id } = req.params;
     const queryOptions = pick(req.query, ['page', 'limit', 'year']);
     const result = await BorrowerService.adminGetBorrowerById(id, queryOptions);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Borrower details retrieved successfully',
          data: result,
     });
});

export const BorrowerController = {
     getProfile,
     updateProfile,
     generateAPIKeys,
     getIntegration,
     adminGetBorrowers,
     adminGetBorrowersCards,
     adminGetBorrowerById,
};
