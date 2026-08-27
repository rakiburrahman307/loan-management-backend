import { model, Schema, Types } from 'mongoose';

export type IRefund = {
     paymentId: Types.ObjectId;
     amount: number;
     reason?: string;
     status: 'PENDING' | 'SUCCESS' | 'FAILED';
     stripeRefundId?: string;
};

const refundSchema = new Schema<IRefund>(
     {
          paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
          amount: { type: Number, required: true },
          reason: { type: String, default: '' },
          status: {
               type: String,
               enum: ['PENDING', 'SUCCESS', 'FAILED'],
               default: 'PENDING',
          },
          stripeRefundId: { type: String, default: '' },
     },
     { timestamps: true },
);

export const Refund = model<IRefund>('Refund', refundSchema);
