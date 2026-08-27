import { Types } from 'mongoose';

export type IStripeConnectedAccount = {
     userId: Types.ObjectId;
     accountId: string;
     chargesEnabled: boolean;
     payoutsEnabled: boolean;
     detailsSubmitted: boolean;
     onboardingUrl?: string;
     status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
};
