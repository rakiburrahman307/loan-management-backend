import { Types } from 'mongoose';

export type ILoanApplication = {
     borrowerId: Types.ObjectId;
     status: 'DRAFT' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
     requestedAmount: number;
     businessDetails: {
          legalName: string;
          crn: string;
          storeUrl: string;
          industrySector: string;
          yearsInBusiness: number;
          registeredAddress: string;
     };
     financials: {
          avgMonthlyRevenue: number;
          annualTurnover: number;
          primarySalesChannel: string;
          monthlySalesVolume: number;
          purpose?: string;
     };
     bankingDetails: {
          bankName: string;
          accountHolderName: string;
          sortCode: string;
          accountNumber: string;
          iban?: string;
     };
     documents: {
          certificateOfIncorporation?: string;
          ownersPhotoId?: string;
          bankStatements?: string[];
          vatReturns?: string[];
     };
     approvedAmount?: number;
     approvedTerms?: {
          durationMonths: number;
          interestRate: number;
          repaymentPercentage: number;
     };
     reviewNotes?: string;
     reviewedBy?: Types.ObjectId;
     reviewedAt?: Date;
     declarationsConfirm?: boolean;
     termsAgree?: boolean;
     submittedAt?: Date;
};

export type ILoan = {
     borrowerId: Types.ObjectId;
     applicationId: Types.ObjectId;
     status: 'ACTIVE' | 'PARTIALLY_REPAID' | 'PAID' | 'DEFAULTED' | 'CANCELLED';
     principalAmount: number;
     totalRepayableAmount: number;
     outstandingBalance: number;
     repaymentPercentage: number;
     disbursementStatus: 'PENDING' | 'DISBURSED' | 'FAILED';
     stripeTransferId?: string;
     repaidAmount: number;
     activatedAt: Date;
};
