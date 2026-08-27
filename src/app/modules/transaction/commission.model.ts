import { model, Schema, Types } from 'mongoose';

export type ICommission = {
     paymentId: Types.ObjectId;
     borrowerId: Types.ObjectId;
     amount: number;
     rate: number;
     status: 'PENDING' | 'SETTLED' | 'FAILED';
};

const commissionSchema = new Schema<ICommission>(
     {
          paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
          borrowerId: { type: Schema.Types.ObjectId, ref: 'Borrower', required: true },
          amount: { type: Number, required: true },
          rate: { type: Number, required: true },
          status: {
               type: String,
               enum: ['PENDING', 'SETTLED', 'FAILED'],
               default: 'PENDING',
          },
     },
     { timestamps: true },
);

export const Commission = model<ICommission>('Commission', commissionSchema);
