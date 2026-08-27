import { model, Schema, Types } from 'mongoose';

export type IChargeback = {
     paymentId: Types.ObjectId;
     amount: number;
     reason?: string;
     status: 'PENDING' | 'RESOLVED' | 'FAILED';
     stripeDisputeId?: string;
};

const chargebackSchema = new Schema<IChargeback>(
     {
          paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
          amount: { type: Number, required: true },
          reason: { type: String, default: '' },
          status: {
               type: String,
               enum: ['PENDING', 'RESOLVED', 'FAILED'],
               default: 'PENDING',
          },
          stripeDisputeId: { type: String, default: '' },
     },
     { timestamps: true },
);

export const Chargeback = model<IChargeback>('Chargeback', chargebackSchema);
