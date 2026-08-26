import {
     IBlockAccount,
     IContact,
     ICreateAccount,
     IHelpContact,
     IHelpReplay,
     IResetPassword,
     IResetPasswordByEmail,
} from '../types/emailTemplate';

const createAccount = (values: ICreateAccount) => {
     const data = {
          to: values.email,
          subject: 'Verify your account',
          html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
        <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
          <h2 style="color: #277E16; font-size: 24px; margin-bottom: 20px;">Hey! ${values.name}, Your Account Credentials</h2>
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your single use code is:</p>
            <div style="background-color: #277E16; width: 120px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.otp}</div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This code is valid for 3 minutes.</p>
        </div>
    </div>
</body>`,
     };
     return data;
};
const contact = (values: IContact) => {
     const data = {
          to: values.email,
          subject: 'We’ve Received Your Message – Thank You!',
          html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">      
      <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <img src="https://res.cloudinary.com/ddhhyc6mr/image/upload/v1742293522/buzzy-box-logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
          <h2 style="color: #277E16; font-size: 24px; margin-bottom: 20px; text-align: center;">Thank You for Contacting Us, ${values.name}!</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5; text-align: center;">
              We have received your message and our team will get back to you as soon as possible.
          </p>
          
          <div style="padding: 15px; background-color: #f4f4f4; border-radius: 8px; margin: 20px 0;">
              <p style="color: #333; font-size: 16px; font-weight: bold;">Your Message Details:</p>
              <p><strong>Name:</strong> ${values.name}</p>
              <p><strong>Email:</strong> ${values.email}</p>
              <p><strong>Subject:</strong> ${values.subject}</p>
              <br/>
              <p><strong>Message:</strong> ${values.message}</p>
          </div>

          <p style="color: #555; font-size: 14px; text-align: center;">
              If your inquiry is urgent, feel free to reach out to us directly at 
              <a href="mailto:support@yourdomain.com" style="color: #277E16; text-decoration: none;">support@yourdomain.com</a>.
          </p>

          <p style="color: #555; font-size: 14px; text-align: center; margin-top: 20px;">
              Best Regards, <br/>
              The [Your Company Name] Team
          </p>
      </div>
  </body>`,
     };
     return data;
};
const resetPassword = (values: IResetPassword) => {
     const data = {
          to: values.email,
          subject: 'Reset your password',
          html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your single use code is:</p>
            <div style="background-color: #277E16; width: 120px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.otp}</div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This code is valid for 3 minutes.</p>
                <p style="color: #b9b4b4; font-size: 16px; line-height: 1.5; margin-bottom: 20px;text-align:left">If you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.</p>
        </div>
    </div>
</body>`,
     };
     return data;
};
const resetPasswordByUrl = (values: IResetPasswordByEmail) => {
     const data = {
          to: values.email,
          subject: 'Reset Your Password',
          html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
      <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${values.resetUrl}" target="_blank" style="display: inline-block; background-color: #277E16; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 18px; margin: 20px auto;">Reset Password</a>
          <p style="color: #555; font-size: 16px; line-height: 1.5; margin-top: 20px;">If you didn’t request this, you can ignore this email.</p>
          <p style="color: #b9b4b4; font-size: 14px;">This link will expire in 10 minutes.</p>
        </div>
      </div>
    </body>`,
     };
     return data;
};

const contactFormTemplate = (values: IHelpContact) => {
     const data = {
          to: values.email,
          subject: 'Thank you for reaching out to us',
          html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hello ${values.name},</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Thank you for reaching out to us. We have received your message:</p>
            <div style="background-color: #f1f1f1; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;">
                <p style="color: #555; font-size: 16px; line-height: 1.5;">"${values.message}"</p>
            </div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">We will get back to you as soon as possible. Below are the details you provided:</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 10px;">Email: ${values.email}</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 10px;">Phone: ${values.phone}</p>
            <p style="color: #b9b4b4; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">If you need immediate assistance, please feel free to contact us directly at our support number.</p>
        </div>
    </div>
</body>`,
     };
     return data;
};
const helpReplyTemplate = (values: IHelpReplay, adminMessage: string) => {
     const data = {
          to: values.email,
          subject: 'Response to Your Help Request',
          html: `<body style="font-family: 'Roboto', sans-serif; background-color: #f3f3f3; margin: 0; padding: 0; color: #333;">
  <div style="max-width: 650px; margin: 40px auto; background-color: #fff; border-radius: 8px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1); padding: 25px; color: #333;">
    <img src="https://res.cloudinary.com/dreiyzj42/image/upload/v1762927212/sundarbanila_hp4s7g.png" alt="Logo" style="display: block; margin: 0 auto 20px; width: 150px;" />
    
    <div style="text-align: left; padding: 0 20px;">
      <p style="font-size: 18px; color: #555; line-height: 1.6; margin-bottom: 15px;">Hello ${values.name},</p>
      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 20px;">Thank you for reaching out! We’ve received your message and our team is working on it. Below are the details:</p>

      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196F3;">
        <p style="font-size: 16px; color: #333; font-weight: bold; margin-bottom: 10px;">Your Message:</p>
        <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">"${values.message}"</p>
      </div>

      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #388e3c;">
        <p style="font-size: 16px; color: #333; font-weight: bold; margin-bottom: 10px;">Our Response:</p>
        <p style="font-size: 16px; color: #388e3c; line-height: 1.6;">"${adminMessage}"</p>
      </div>

      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 20px;">If you have further questions or need additional assistance, feel free to reach out. We're here to help.</p>
      
      <div style="border-top: 1px solid #f1f1f1; padding-top: 20px; text-align: center;">
        <p style="font-size: 14px; color: #888;">Best regards,</p>
        <p style="font-size: 16px; font-weight: bold; color: #333;">Support Team</p>
        <p style="font-size: 14px; color: #888;">Company Name | <a href="https://www.companywebsite.com" style="color: #2196F3; text-decoration: none;">www.companywebsite.com</a></p>
      </div>
    </div>
  </div>
</body>`,
     };
     return data;
};
const blockAccountTemplate = (values: IBlockAccount) => {
     const data = {
          to: values.email,
          subject: 'Account Blocked Notification',
          html: `<body style="font-family: 'Roboto', sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; color: #333;">
  <div style="max-width: 650px; margin: 40px auto; background-color: #fff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); padding: 30px; color: #333;">
    <img src="https://res.cloudinary.com/dreiyzj42/image/upload/v1762927212/sundarbanila_hp4s7g.png" alt="Logo" style="display: block; margin: 0 auto 25px; width: 160px;" />
    
    <div style="text-align: left; padding: 0 20px;">
      <p style="font-size: 20px; color: #444; line-height: 1.6; margin-bottom: 15px;">Hello ${values.name},</p>
      <p style="font-size: 16px; color: #555; line-height: 1.8; margin-bottom: 25px;">We regret to inform you that your account has been blocked due to a violation of our Terms of Service. Please find the details below:</p>
      
      <p style="font-size: 16px; color: #555; line-height: 1.7; margin-bottom: 25px;">If you believe this action was taken in error or wish to appeal the decision, please feel free to reach out to us. We're happy to assist you further.</p>
      
      <div style="border-top: 2px solid #f1f1f1; padding-top: 30px; text-align: center;">
        <p style="font-size: 14px; color: #888; margin: 0;">Best regards,</p>
        <p style="font-size: 16px; font-weight: bold; color: #333;">Support Team</p>
        <p style="font-size: 14px; color: #888; margin-top: 5px;">Company Name | <a href="https://www.companywebsite.com" style="color: #2196F3; text-decoration: none;">www.companywebsite.com</a></p>
      </div>
    </div>
  </div>
</body>`,
     };
     return data;
};
export const emailTemplate = {
     createAccount,
     resetPassword,
     resetPasswordByUrl,
     contactFormTemplate,
     contact,
     helpReplyTemplate,
     blockAccountTemplate,
};
