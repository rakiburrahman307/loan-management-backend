import { model, Schema, Types } from 'mongoose';

export type ISupportTicket = {
     userId: Types.ObjectId;
     subject: string;
     message: string;
     status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
     replies?: Array<{
          senderId: Types.ObjectId;
          message: string;
          createdAt: Date;
     }>;
};

const supportTicketSchema = new Schema<ISupportTicket>(
     {
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          subject: { type: String, required: true },
          message: { type: String, required: true },
          status: {
               type: String,
               enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'],
               default: 'OPEN',
          },
          replies: [
               {
                    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                    message: { type: String, required: true },
                    createdAt: { type: Date, default: Date.now },
               },
          ],
     },
     { timestamps: true },
);

export const SupportTicket = model<ISupportTicket>('SupportTicket', supportTicketSchema);
