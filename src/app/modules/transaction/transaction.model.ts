import { model, Schema, Types } from 'mongoose';

export type ITransaction = {
     loanId?: Types.ObjectId;
     borrowerId: Types.ObjectId;
     paymentId?: Types.ObjectId;
     type: 'DISBURSEMENT' | 'SALE' | 'REPAYMENT' | 'COMMISSION' | 'REFUND' | 'CHARGEBACK';
     amount: number;
     currency: string;
     status: 'PENDING' | 'SUCCESS' | 'FAILED';
     stripeTransferId?: string;
     stripeChargeId?: string;
     description?: string;
};

const transactionSchema = new Schema<ITransaction>(
     {
          loanId: { type: Schema.Types.ObjectId, ref: 'Loan' },
          borrowerId: { type: Schema.Types.ObjectId, ref: 'Borrower', required: true },
          paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
          type: {
               type: String,
               enum: ['DISBURSEMENT', 'SALE', 'REPAYMENT', 'COMMISSION', 'REFUND', 'CHARGEBACK'],
               required: true,
          },
          amount: { type: Number, required: true },
          currency: { type: String, default: 'gbp' },
          status: {
               type: String,
               enum: ['PENDING', 'SUCCESS', 'FAILED'],
               default: 'PENDING',
          },
          stripeTransferId: { type: String, default: '' },
          stripeChargeId: { type: String, default: '' },
          description: { type: String, default: '' },
     },
     { timestamps: true },
);

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
