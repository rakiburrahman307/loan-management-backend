import { model, Schema } from 'mongoose';

export type IWebhookEvent = {
     eventId: string;
     type: string;
     processed: boolean;
     processedAt?: Date;
     error?: string;
};

const webhookEventSchema = new Schema<IWebhookEvent>(
     {
          eventId: { type: String, required: true, unique: true },
          type: { type: String, required: true },
          processed: { type: Boolean, default: false },
          processedAt: { type: Date },
          error: { type: String },
     },
     { timestamps: true },
);

export const WebhookEvent = model<IWebhookEvent>('WebhookEvent', webhookEventSchema);
