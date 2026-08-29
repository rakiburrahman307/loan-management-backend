import { Types } from 'mongoose';

export type IBorrower = {
     userId: Types.ObjectId;
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
     primaryContact?: {
          fullName: string;
          businessEmail: string;
          phoneNumber: string;
     };
     stripeAccountId?: string;
     stripeOnboardingComplete: boolean;
};
