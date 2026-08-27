import { z } from 'zod';

const businessDetailsSchema = z.object({
     legalName: z.string().min(1, 'Legal name is required'),
     crn: z.string().length(8, 'CRN must be exactly 8 digits'),
     storeUrl: z.string().url('Store URL must be a valid URL'),
     industrySector: z.string().min(1, 'Industry sector is required'),
     yearsInBusiness: z.number().min(0, 'Years in business must be positive'),
     registeredAddress: z.string().min(1, 'Registered address is required'),
});

const financialsSchema = z.object({
     avgMonthlyRevenue: z.number().min(1, 'Average monthly revenue is required'),
     annualTurnover: z.number().min(1, 'Annual turnover is required'),
     primarySalesChannel: z.string().min(1, 'Primary sales channel is required'),
     monthlySalesVolume: z.number().min(1, 'Monthly sales volume is required'),
     purpose: z.string().optional(),
});

const bankingDetailsSchema = z.object({
     bankName: z.string().min(1, 'Bank name is required'),
     accountHolderName: z.string().min(1, 'Account holder name is required'),
     sortCode: z.string().min(1, 'Sort code is required'),
     accountNumber: z.string().min(1, 'Account number is required'),
     iban: z.string().optional(),
});

const submitApplicationZodSchema = z.object({
     body: z.object({
          requestedAmount: z.number().optional(),
          businessDetails: z.object({
               legalName: z.string().optional(),
               crn: z.string().optional(),
               storeUrl: z.string().optional(),
               industrySector: z.string().optional(),
               yearsInBusiness: z.number().optional(),
               registeredAddress: z.string().optional(),
          }).optional(),
          financials: z.object({
               avgMonthlyRevenue: z.number().optional(),
               annualTurnover: z.number().optional(),
               primarySalesChannel: z.string().optional(),
               monthlySalesVolume: z.number().optional(),
               purpose: z.string().optional(),
          }).optional(),
          bankingDetails: z.object({
               bankName: z.string().optional(),
               accountHolderName: z.string().optional(),
               sortCode: z.string().optional(),
               accountNumber: z.string().optional(),
               iban: z.string().optional(),
          }).optional(),
          certificateOfIncorporation: z.string().nullable().optional(),
          ownersPhotoId: z.string().nullable().optional(),
          bankStatements: z.array(z.string()).nullable().optional(),
          vatReturns: z.array(z.string()).nullable().optional(),
          declarationsConfirm: z.boolean().refine(val => val === true, {
               message: 'You must confirm accuracy of details',
          }),
          termsAgree: z.boolean().refine(val => val === true, {
               message: 'You must agree to terms and privacy policy',
          }),
     }),
});

const saveDraftZodSchema = z.object({
     body: z.object({
          requestedAmount: z.number().optional(),
          businessDetails: z.object({
               legalName: z.string().optional(),
               crn: z.string().optional(),
               storeUrl: z.string().optional(),
               industrySector: z.string().optional(),
               yearsInBusiness: z.number().optional(),
               registeredAddress: z.string().optional(),
          }).optional(),
          financials: z.object({
               avgMonthlyRevenue: z.number().optional(),
               annualTurnover: z.number().optional(),
               primarySalesChannel: z.string().optional(),
               monthlySalesVolume: z.number().optional(),
               purpose: z.string().optional(),
          }).optional(),
          bankingDetails: z.object({
               bankName: z.string().optional(),
               accountHolderName: z.string().optional(),
               sortCode: z.string().optional(),
               accountNumber: z.string().optional(),
               iban: z.string().optional(),
          }).optional(),
          certificateOfIncorporation: z.string().nullable().optional(),
          ownersPhotoId: z.string().nullable().optional(),
          bankStatements: z.array(z.string()).nullable().optional(),
          vatReturns: z.array(z.string()).nullable().optional(),
     }),
});

const adminReviewZodSchema = z.object({
     body: z.object({
          status: z.enum(['APPROVED', 'REJECTED']),
          approvedAmount: z.number().min(1000).max(250000).optional(),
          approvedTerms: z.object({
               durationMonths: z.number().min(1),
               interestRate: z.number().min(0),
               repaymentPercentage: z.number().min(1).max(100),
          }).optional(),
          reviewNotes: z.string().optional(),
     }),
});

export const LoanValidation = {
     submitApplicationZodSchema,
     saveDraftZodSchema,
     adminReviewZodSchema,
};
