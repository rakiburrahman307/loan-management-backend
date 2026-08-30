import { model, Schema, Types } from 'mongoose';

export type IIntegration = {
     userId: Types.ObjectId;
     apiKey: string;
     apiKeyPreview: string;
     webhookSecret: string;
     webhookUrl?: string;
     webhookStatus: 'CONNECTED' | 'DISCONNECTED' | 'NOT_CONFIGURED';
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
          webhookUrl: { type: String, default: '' },
          webhookStatus: {
               type: String,
               enum: ['CONNECTED', 'DISCONNECTED', 'NOT_CONFIGURED'],
               default: 'NOT_CONFIGURED',
          },
          isActive: { type: Boolean, default: true },
     },
     { timestamps: true },
);

export const Integration = model<IIntegration>('Integration', integrationSchema);
