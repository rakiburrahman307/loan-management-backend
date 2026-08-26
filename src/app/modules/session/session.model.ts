import { model, Schema } from 'mongoose';
import { ISession, SessionModel } from './session.interface';

const sessionSchema = new Schema<ISession, SessionModel>(
     {
          user: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
          },
          userAgent: {
               type: String,
               default: '',
          },
          device: {
               type: String,
               default: 'Desktop',
          },
          os: {
               type: String,
               default: 'Unknown OS',
          },
          browser: {
               type: String,
               default: 'Unknown Browser',
          },
          ip: {
               type: String,
               default: '',
          },
          isRevoked: {
               type: Boolean,
               default: false,
          },
          lastActive: {
               type: Date,
               default: Date.now,
          },
          expireAt: {
               type: Date,
               required: true,
          },
     },
     { timestamps: true },
);

// TTL Index to automatically delete expired sessions from the database
sessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ user: 1, isRevoked: 1 });

export const Session = model<ISession, SessionModel>('Session', sessionSchema);
