import { model, Schema, Types } from 'mongoose';

export type IIntegration = {
     userId: Types.ObjectId;
     apiKey: string;
     apiKeyPreview: string;
     webhookSecret: string;
     storeUrl?: string;
     webhookUrl?: string;
     isActive: boolean;
};

const integrationSchema = new Schema<IIntegration>(
     {
          userId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
               unique: true,
          },
          apiKey: { type: String, required: true },
          apiKeyPreview: { type: String, required: true },
          webhookSecret: { type: String, required: true },
          storeUrl: { type: String, default: '' },
          webhookUrl: { type: String, default: '' },
          isActive: { type: Boolean, default: true },
     },
     { timestamps: true },
);

export const Integration = model<IIntegration>('Integration', integrationSchema);
