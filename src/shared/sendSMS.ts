import twilio from 'twilio';
import config from '../config';
import { StatusCodes } from 'http-status-codes';
import AppError from '../errors/AppError';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);
const sendSMS = async (to: string, message: string) => {
     try {
          await client.messages.create({
               body: message,
               from: config.twilio.phoneNumber,
               to: to,
          });
          return {
               invalid: false,
               message: `Message sent successfully to ${to}`,
          };
     } catch (error) {
          throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send sms');
     }
};

export default sendSMS;
