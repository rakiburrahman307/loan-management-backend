import { model, Schema, Types } from 'mongoose';

export type ILoanRepayment = {
     loanId: Types.ObjectId;
     paymentId?: Types.ObjectId;
     amount: number;
     date: Date;
};

const loanRepaymentSchema = new Schema<ILoanRepayment>(
     {
          loanId: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
          paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
          amount: { type: Number, required: true },
          date: { type: Date, default: Date.now },
     },
     { timestamps: true },
);

export const LoanRepayment = model<ILoanRepayment>('LoanRepayment', loanRepaymentSchema);
