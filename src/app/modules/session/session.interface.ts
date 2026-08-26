import { Model, Types } from 'mongoose';

export type ISession = {
     user: Types.ObjectId;
     userAgent: string;
     device: string;
     os: string;
     browser: string;
     ip: string;
     isRevoked: boolean;
     lastActive: Date;
     expireAt: Date;
};

export type SessionModel = Model<ISession>;
