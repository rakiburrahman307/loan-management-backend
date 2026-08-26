import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES } from '../../../enums/user';
import AppError from '../../../errors/AppError';
import { IUser, UserModel } from './user.interface';

const userSchema = new Schema<IUser, UserModel>(
     {
          name: {
               type: String,
               required: true,
          },
          role: {
               type: String,
               enum: Object.values(USER_ROLES),
               default: USER_ROLES.USER,
          },
          email: {
               type: String,
               required: true,
               unique: true,
               lowercase: true,
          },
          password: {
               type: String,
               required: function () {
                    // Password is only required for non-OAuth users
                    return !this.oauthProvider;
               },
               select: false,
               minlength: 8,
          },
          image: {
               type: String,
               default: '',
          },
          status: {
               type: String,
               enum: ['active', 'blocked'],
               default: 'active',
          },
          isVerified: {
               type: Boolean,
               default: false,
          },
          isDeleted: {
               type: Boolean,
               default: false,
          },
          stripeCustomerId: {
               type: String,
               default: '',
          },
          // OAuth fields
          googleId: {
               type: String,
               sparse: true,
          },
          facebookId: {
               type: String,
               sparse: true,
          },
          oauthProvider: {
               type: String,
               enum: ['google', 'facebook'],
          },
          authentication: {
               type: {
                    purpose: {
                         type: String,
                         enum: ['signup', 'resetPassword'],
                         default: null,
                    },
                    isResetPassword: {
                         type: Boolean,
                         default: false,
                    },
                    oneTimeCode: {
                         type: String,
                         default: null,
                    },
                    expireAt: {
                         type: Date,
                         default: null,
                    },
                    loginAttempts: {
                         type: Number,
                         default: 0,
                    },
                    blockedUntil: {
                         type: Date,
                         default: null,
                    },
                    otpRequestedAt: {
                         type: Date,
                         default: null,
                    },
               },
               select: false,
          },
          onlineStatus: {
               isOnline: {
                    type: Boolean,
                    default: false,
               },
               lastSeen: {
                    type: Date,
                    default: Date.now,
               },
               lastHeartbeat: {
                    type: Date,
                    default: Date.now,
               },
          },
     },
     { timestamps: true },
);

// Exist User Check
userSchema.statics.isExistUserById = async (id: string) => {
     return await User.findById(id);
};

// db.users.updateOne({email:"tihow91361@linxues.com"},{email:"rakibhassan305@gmail.com"})

userSchema.statics.isExistUserByEmail = async (email: string) => {
     return await User.findOne({ email });
};
userSchema.statics.isExistUserByPhone = async (contact: string) => {
     return await User.findOne({ contact });
};
// Password Matching
userSchema.statics.isMatchPassword = async (
     password: string,
     hashPassword: string,
): Promise<boolean> => {
     return await bcrypt.compare(password, hashPassword);
};

// Pre-Save Hook for Hashing Password & Checking Email Uniqueness
userSchema.pre('save', async function (next) {
     // Only check email uniqueness if this is a new user or email is being changed
     if (this.isNew || this.isModified('email')) {
          const existingUser = await User.findOne({ email: this.get('email') });
          if (existingUser && existingUser._id.toString() !== this._id.toString()) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Email already exists!');
          }
     }

     // Only hash password if it's provided and modified
     if (this.password && this.isModified('password')) {
          this.password = await bcrypt.hash(this.password, Number(config.bcrypt_salt_rounds));
     }

     // Auto-verify OAuth users
     if (this.oauthProvider && !this.isVerified) {
          this.isVerified = true;
     }
     next();
});
// ✅ Online Status Methods
userSchema.statics.setUserOnline = async (userId: string) => {
     await User.findByIdAndUpdate(userId, {
          'onlineStatus.isOnline': true,
          'onlineStatus.lastSeen': new Date(),
          'onlineStatus.lastHeartbeat': new Date(),
     });
};

userSchema.statics.setUserOffline = async (userId: string) => {
     await User.findByIdAndUpdate(userId, {
          'onlineStatus.isOnline': false,
          'onlineStatus.lastSeen': new Date(),
     });
};

userSchema.statics.updateHeartbeat = async (userId: string) => {
     await User.findByIdAndUpdate(userId, {
          'onlineStatus.lastHeartbeat': new Date(),
          'onlineStatus.lastSeen': new Date(),
     });
};

userSchema.statics.getOnlineUsers = async () => {
     return await User.find({ 'onlineStatus.isOnline': true }).select(
          'name userName profile onlineStatus',
     );
};

userSchema.statics.bulkUserStatus = async (userIds: string[]) => {
     return await User.find({ _id: { $in: userIds } }).select('name userName profile onlineStatus');
};
// Query Middleware
userSchema.pre('find', function (this: any, next) {
     const filter = this.getFilter();
     if (filter.isDeleted === undefined) {
          this.find({ isDeleted: { $ne: true } });
     }
     next();
});

userSchema.pre('findOne', function (this: any, next) {
     const filter = this.getFilter();
     if (filter.isDeleted === undefined) {
          this.find({ isDeleted: { $ne: true } });
     }
     next();
});

userSchema.pre('aggregate', function (this: any, next) {
     const hasDeletedStage = this.pipeline().some(
          (stage: any) => stage.$match && stage.$match.isDeleted !== undefined,
     );
     if (!hasDeletedStage) {
          this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
     }
     next();
});
userSchema.index({ 'onlineStatus.isOnline': 1 });
userSchema.index({ 'onlineStatus.lastHeartbeat': 1 });
export const User = model<IUser, UserModel>('User', userSchema);
