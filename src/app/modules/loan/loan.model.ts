import { model, Schema } from 'mongoose';
import { ILoan } from './loan.interface';

const loanSchema = new Schema<ILoan>(
     {
          borrowerId: {
               type: Schema.Types.ObjectId,
               ref: 'Borrower',
               required: true,
          },
          applicationId: {
               type: Schema.Types.ObjectId,
               ref: 'LoanApplication',
               required: true,
          },
          status: {
               type: String,
               enum: ['ACTIVE', 'PARTIALLY_REPAID', 'PAID', 'DEFAULTED', 'CANCELLED'],
               default: 'ACTIVE',
          },
          principalAmount: { type: Number, required: true },
          totalRepayableAmount: { type: Number, required: true },
          outstandingBalance: { type: Number, required: true },
          repaymentPercentage: { type: Number, required: true },
          disbursementStatus: {
               type: String,
               enum: ['PENDING', 'DISBURSED', 'FAILED'],
               default: 'PENDING',
          },
          stripeTransferId: { type: String, default: '' },
          repaidAmount: { type: Number, default: 0 },
          activatedAt: { type: Date, default: Date.now },
     },
     { timestamps: true },
);

export const Loan = model<ILoan>('Loan', loanSchema);
