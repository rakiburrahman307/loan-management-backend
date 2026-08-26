import config from '../../config';
import twilio from 'twilio';
const twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
export default twilioClient;
