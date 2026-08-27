import { model, Schema, Types } from 'mongoose';

export type IPayment = {
     borrowerId: Types.ObjectId;
     paymentIntentId: string;
     checkoutSessionId?: string;
     amount: number;
     currency: string;
     status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
     customerEmail?: string;
     metadata?: Record<string, any>;
};

const paymentSchema = new Schema<IPayment>(
     {
          borrowerId: {
               type: Schema.Types.ObjectId,
               ref: 'Borrower',
               required: true,
          },
          paymentIntentId: { type: String, required: true, unique: true },
          checkoutSessionId: { type: String },
          amount: { type: Number, required: true },
          currency: { type: String, default: 'gbp' },
          status: {
               type: String,
               enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
               default: 'PENDING',
          },
          customerEmail: { type: String, default: '' },
          metadata: { type: Schema.Types.Mixed, default: {} },
     },
     { timestamps: true },
);

export const Payment = model<IPayment>('Payment', paymentSchema);
