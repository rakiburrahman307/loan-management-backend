import { model, Schema } from 'mongoose';
import { IBorrower } from './borrower.interface';

const borrowerSchema = new Schema<IBorrower>(
     {
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
               unique: true,
          },
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
          primaryContact: {
               fullName: { type: String, default: '' },
               businessEmail: { type: String, default: '' },
               phoneNumber: { type: String, default: '' },
          },
          stripeAccountId: { type: String, default: '' },
          stripeOnboardingComplete: { type: Boolean, default: false },
     },
     { timestamps: true },
);

export const Borrower = model<IBorrower>('Borrower', borrowerSchema);
