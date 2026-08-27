import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { DashboardService } from './dashboard.service';

const getAdminOverviewCards = catchAsync(async (req, res) => {
     const result = await DashboardService.getAdminOverviewCards();
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Admin dashboard overview cards retrieved successfully',
          data: result,
     });
});

const getAdminFundingVsRepaymentsChart = catchAsync(async (req, res) => {
     const result = await DashboardService.getAdminFundingVsRepaymentsChart();
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Admin dashboard funding vs repayments chart retrieved successfully',
          data: result,
     });
});

const getAdminRecentApplications = catchAsync(async (req, res) => {
     const result = await DashboardService.getAdminRecentApplications();
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Admin dashboard recent applications retrieved successfully',
          data: result,
     });
});

const getClientOverviewCards = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await DashboardService.getClientOverviewCards(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Client dashboard overview cards retrieved successfully',
          data: result,
     });
});

const getClientRepaymentProgress = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await DashboardService.getClientRepaymentProgress(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Client dashboard repayment progress retrieved successfully',
          data: result,
     });
});

const getClientSalesVsRepaymentChart = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await DashboardService.getClientSalesVsRepaymentChart(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Client dashboard sales vs repayment chart retrieved successfully',
          data: result,
     });
});

const getClientRecentTransactions = catchAsync(async (req, res) => {
     const userId = req.user.id;
     const result = await DashboardService.getClientRecentTransactions(userId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Client dashboard recent transactions retrieved successfully',
          data: result,
     });
});

export const DashboardController = {
     getAdminOverviewCards,
     getAdminFundingVsRepaymentsChart,
     getAdminRecentApplications,
     getClientOverviewCards,
     getClientRepaymentProgress,
     getClientSalesVsRepaymentChart,
     getClientRecentTransactions,
};
