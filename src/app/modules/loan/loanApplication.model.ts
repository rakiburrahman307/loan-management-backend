import { model, Schema } from 'mongoose';
import { ILoanApplication } from './loan.interface';

const loanApplicationSchema = new Schema<ILoanApplication>(
     {
          borrowerId: {
               type: Schema.Types.ObjectId,
               ref: 'Borrower',
               required: true,
          },
          status: {
               type: String,
               enum: ['DRAFT', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'],
               default: 'DRAFT',
          },
          requestedAmount: { type: Number, default: 0 },
          businessDetails: {
               legalName: { type: String, default: '' },
               crn: { type: String, default: '' },
               storeUrl: { type: String, default: '' },
               industrySector: { type: String, default: '' },
               yearsInBusiness: { type: Number, default: 0 },
               registeredAddress: { type: String, default: '' },
          },
          financials: {
               avgMonthlyRevenue: { type: Number, default: 0 },
               annualTurnover: { type: Number, default: 0 },
               primarySalesChannel: { type: String, default: '' },
               monthlySalesVolume: { type: Number, default: 0 },
               purpose: { type: String, default: 'Inventory & Expansion' },
          },
          bankingDetails: {
               bankName: { type: String, default: '' },
               accountHolderName: { type: String, default: '' },
               sortCode: { type: String, default: '' },
               accountNumber: { type: String, default: '' },
               iban: { type: String, default: '' },
          },
          documents: {
               certificateOfIncorporation: { type: String, default: '' },
               ownersPhotoId: { type: String, default: '' },
               bankStatements: [{ type: String }],
               vatReturns: [{ type: String }],
          },
          approvedAmount: { type: Number },
          approvedTerms: {
               durationMonths: { type: Number },
               interestRate: { type: Number },
               repaymentPercentage: { type: Number },
          },
          reviewNotes: { type: String, default: '' },
          reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
          reviewedAt: { type: Date },
          declarationsConfirm: { type: Boolean, default: false },
          termsAgree: { type: Boolean, default: false },
          submittedAt: { type: Date },
     },
     { timestamps: true },
);

export const LoanApplication = model<ILoanApplication>('LoanApplication', loanApplicationSchema);
