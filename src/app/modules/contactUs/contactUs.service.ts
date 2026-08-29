import { EmailQueueHelper } from '../../../helpers/bullMQ/bullHelper';

const sendContactEmail = async (payload: {
     name: string;
     email: string;
     phone?: string;
     subject: string;
     message: string;
}) => {
     // 1. Queue email to the support team using helper
     await EmailQueueHelper.sendContactNotificationToAdmin(payload);

     // 2. Queue confirmation receipt email to the user using helper
     await EmailQueueHelper.sendContactConfirmation(
          payload.email,
          payload.name,
          payload.message,
          payload.phone || 'N/A',
     );
};

export const ContactUsService = {
     sendContactEmail,
};
