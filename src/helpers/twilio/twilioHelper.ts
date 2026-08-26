import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import AppError from '../../errors/AppError';
import twilioClient from '../../integrations/twilio/twilio.config';

const sendOTP = async (phone: string, countryCode: string = '+880') => {
     const toNumber = `${countryCode}${phone}`;
     const verification = await twilioClient.verify.v2
          .services(config.twilio.verifyServiceSid)
          .verifications.create({
               to: toNumber,
               channel: 'sms',
          });

     return verification.status; // 'pending'
};

const verifyOTP = async (phone: string, code: string, countryCode: string = '+880') => {
     const toNumber = `${countryCode}${phone}`;

     const result = await twilioClient.verify.v2
          .services(config.twilio.verifyServiceSid)
          .verificationChecks.create({
               to: toNumber,
               code,
          });

     if (result.status !== 'approved') {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid or expired OTP');
     }

     return true;
};

export const twilioHelper = { sendOTP, verifyOTP };
