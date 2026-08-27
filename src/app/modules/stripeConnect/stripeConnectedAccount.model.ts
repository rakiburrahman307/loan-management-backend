import { model, Schema } from 'mongoose';
import { IStripeConnectedAccount } from './stripeConnect.interface';

const stripeConnectedAccountSchema = new Schema<IStripeConnectedAccount>(
     {
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
               unique: true,
          },
          accountId: { type: String, required: true, unique: true },
          chargesEnabled: { type: Boolean, default: false },
          payoutsEnabled: { type: Boolean, default: false },
          detailsSubmitted: { type: Boolean, default: false },
          onboardingUrl: { type: String, default: '' },
          status: {
               type: String,
               enum: ['PENDING', 'ACTIVE', 'INACTIVE'],
               default: 'PENDING',
          },
     },
     { timestamps: true },
);

export const StripeConnectedAccount = model<IStripeConnectedAccount>(
     'StripeConnectedAccount',
     stripeConnectedAccountSchema,
);
