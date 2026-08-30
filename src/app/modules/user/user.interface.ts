import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';
export type IUser = {
     name: string;
     role: USER_ROLES;
     email: string;
     password?: string;
     image?: string;
     phone?: string;
     address?: string;
     isDeleted: boolean;
     stripeCustomerId: string;
     status: 'active' | 'blocked';
     isVerified: boolean;
     googleId?: string;
     facebookId?: string;
     oauthProvider?: 'google' | 'facebook';
     authentication?: {
          purpose: 'signup' | 'resetPassword';
          attempts: number;
          isResetPassword: boolean;
          oneTimeCode: string;
          expireAt: Date;
          loginAttempts?: number;
          blockedUntil?: Date;
          otpRequestedAt?: Date;
     };
     // ✅ Online Status Interface
     onlineStatus?: {
          isOnline?: boolean;
          lastSeen?: Date;
          lastHeartbeat?: Date;
     };
};

export type UserModel = {
     isExistUserById(id: string): any;
     isExistUserByEmail(email: string): any;
     isExistUserByPhone(contact: string): any;
     isMatchPassword(password: string, hashPassword: string): boolean;
     // ✅ Online Status Methods
     setUserOnline(userId: string): Promise<void>;
     setUserOffline(userId: string): Promise<void>;
     updateHeartbeat(userId: string): Promise<void>;
     getOnlineUsers(): Promise<IUser[]>;
     bulkUserStatus(userIds: string[]): Promise<IUser[]>;
} & Model<IUser>;
