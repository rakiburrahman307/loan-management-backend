import crypto from 'crypto';
import { model, Schema } from 'mongoose';
import { IResetToken, ResetTokenModel } from './resetToken.interface';

const hashToken = (token: string): string => {
     return crypto.createHash('sha256').update(token).digest('hex');
};

const resetTokenSchema = new Schema<IResetToken, ResetTokenModel>(
     {
          user: {
               type: Schema.Types.ObjectId,
               ref: 'User',
          },
          token: {
               type: String,
               required: true,
          },
          expireAt: {
               type: Date,
               required: true,
          },
     },
     { timestamps: true },
);

// Pre-save hook to hash the token before saving
resetTokenSchema.pre('save', function (next) {
     if (this.isModified('token')) {
          this.token = hashToken(this.token);
     }
     next();
});

//token check
resetTokenSchema.statics.isExistToken = async (token: string): Promise<IResetToken | null> => {
     const hashedToken = hashToken(token);
     return await ResetToken.findOne({ token: hashedToken });
};

//token validity check
resetTokenSchema.statics.isExpireToken = async (token: string) => {
     const currentDate = new Date();
     const hashedToken = hashToken(token);
     const resetToken = await ResetToken.findOne({
          token: hashedToken,
          expireAt: { $gt: currentDate },
     });
     return !!resetToken;
};

export const ResetToken = model<IResetToken, ResetTokenModel>('Token', resetTokenSchema);
