import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import AppError from '../../../errors/AppError';
import { ContactUsService } from './contactUs.service';

const submitContactUs = catchAsync(async (req, res) => {
     const { name, email, phone, subject, message } = req.body;

     if (!name || !email || !subject || !message) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Name, email, subject, and message are required.');
     }

     await ContactUsService.sendContactEmail({
          name,
          email,
          phone,
          subject,
          message,
     });

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Your message has been sent successfully. We will get back to you soon!',
     });
});

export const ContactUsController = {
     submitContactUs,
};
