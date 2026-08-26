import crypto from 'crypto';

const generateOTP = (length: number = 4): string => {
     const min = Math.pow(10, length - 1);
     const max = Math.pow(10, length) - 1;

     // Generate cryptographically secure random number
     const otp = crypto.randomInt(min, max + 1);

     // Pad with leading zeros if needed
     return otp.toString().padStart(length, '0');
};

export default generateOTP;
