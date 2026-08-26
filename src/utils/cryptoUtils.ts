import crypto from 'crypto';
import config from '../config';

export const otpEncode = (otp: string, identifier: string): string => {
     return crypto
          .createHmac('sha256', config.otp.secret)
          .update(`${otp}-${identifier}`) // OTP + User context
          .digest('hex');
};

export const otpVerify = (otp: string, identifier: string, encodedOtp: string): boolean => {
     const hashToCompare = otpEncode(otp, identifier);
     const bufA = Buffer.from(hashToCompare);
     const bufB = Buffer.from(encodedOtp);
     if (bufA.length !== bufB.length) {
          return false;
     }
     return crypto.timingSafeEqual(bufA, bufB);
};
