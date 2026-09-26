import {
     IBlockAccount,
     IContact,
     ICreateAccount,
     IHelpContact,
     IHelpReplay,
     IResetPassword,
} from '../types/emailTemplate';

const createAccount = (values: ICreateAccount) => {
     const data = {
          to: values.email,
          subject: 'Verify your account',
          html: `<body style="margin:0; padding:0; background-color:#F4F7FC; font-family:Arial, Helvetica, sans-serif; color:#172033;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background-color:#F4F7FC; padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="max-width:600px; background-color:#FFFFFF; border-radius:12px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:35px 25px 20px;">

              <img
                src="https://i.postimg.cc/6pgNvKhD/logo.png"
                alt="YourBrand Logo"
                width="150"
                style="display:block; width:150px; max-width:100%; height:auto; border:0; margin-bottom:15px;"
              />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td align="center" style="padding:20px 35px 10px;">

              <h2 style="margin:0 0 12px; font-size:25px; line-height:1.4; color:#172033; font-weight:700;">
                Hey ${values.name},
              </h2>

              <h1 style="margin:0 0 20px; font-size:22px; line-height:1.4; color:#165DFF; font-weight:700;">
                Verify Your Account
              </h1>

              <p style="margin:0; font-size:15px; line-height:1.8; color:#64748B;">
                We received a request to verify your account.
                Use the verification code below to securely
                complete your request.
              </p>

            </td>
          </tr>

          <!-- OTP Section -->
          <tr>
            <td align="center" style="padding:30px 35px 15px;">

              <p style="margin:0 0 15px; font-size:14px; color:#64748B;">
                YOUR ONE-TIME VERIFICATION CODE
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                style="max-width:400px; background-color:#165DFF; border-radius:10px;">
                <tr>
                  <td align="center" style="padding:22px 15px;">

                    <p style="margin:0; font-size:32px; font-weight:700; letter-spacing:8px; color:#FFFFFF; font-family:Arial, Helvetica, sans-serif;">
                      ${values.otp}
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Expiration Notice -->
          <tr>
            <td align="center" style="padding:15px 35px 30px;">

              <p style="margin:0; font-size:14px; line-height:1.8; color:#64748B;">
                This verification code will expire in
                <span style="color:#165DFF; font-weight:700;">3 minutes.</span>
              </p>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 35px;">
              <div style="height:1px; background-color:#E8EDF5; font-size:0; line-height:0;">
                &nbsp;
              </div>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td align="center" style="padding:25px 35px 10px;">

              <p style="margin:0; font-size:13px; line-height:1.8; color:#8491A7;">
                If you didn't request this verification code,
                you can safely ignore this email.
                For your security, never share this code with anyone.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:15px 25px 35px;">

              <p style="margin:0 0 8px; font-size:14px; color:#64748B;">
                Best regards,
              </p>

              <p style="margin:0; font-size:15px; font-weight:700; color:#165DFF;">
                YourBrand Team
              </p>

            </td>
          </tr>

        </table>

        <!-- Copyright -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="max-width:600px;">
          <tr>
            <td align="center" style="padding:20px 15px;">

              <p style="margin:0; font-size:12px; line-height:1.6; color:#94A3B8;">
                This is an automated email. Please do not reply to this message.
              </p>

              <p style="margin:8px 0 0; font-size:12px; color:#94A3B8;">
                &copy; ${new Date().getFullYear()} Finlora. All rights reserved.
              </p>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

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
          html: `<body style="margin:0; padding:0; background-color:#F4F7FC; font-family:Arial, Helvetica, sans-serif; color:#334155;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="background-color:#F4F7FC; padding:40px 15px;">
    <tr>
      <td align="center">

        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="max-width:600px; background-color:#FFFFFF; border-radius:12px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:35px 25px 25px;">
              <img
                src="https://i.postimg.cc/6pgNvKhD/logo.png"
                alt="Logo"
                width="150"
                style="display:block; width:150px; max-width:100%; height:auto; border:0;"
              />
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding:10px 30px 0;">
              <h2 style="margin:0 0 12px; font-size:24px; line-height:1.4; font-weight:700; color:#172033;">
                Email Verification
              </h2>

              <p style="margin:0; font-size:15px; line-height:1.7; color:#64748B;">
                Use the verification code below to complete your request.
              </p>
            </td>
          </tr>

          <!-- OTP -->
          <tr>
            <td align="center" style="padding:30px 25px 15px;">

              <p style="margin:0 0 15px; font-size:14px; color:#64748B;">
                YOUR SINGLE-USE CODE
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0"
                style="background-color:#165DFF; border-radius:10px;">
                <tr>
                  <td align="center" style="padding:18px 30px;">
                    <span style="font-size:30px; font-weight:700; letter-spacing:8px; color:#FFFFFF;">
                      ${values.otp}
                    </span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Expiration -->
          <tr>
            <td align="center" style="padding:15px 25px 30px;">
              <p style="margin:0; font-size:14px; line-height:1.7; color:#64748B;">
                This code is valid for
                <span style="color:#165DFF; font-weight:700;">3 minutes.</span>
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding:0 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#F4F7FC; border-radius:8px;">
                <tr>
                  <td style="padding:18px 20px;">

                    <p style="margin:0 0 8px; font-size:14px; font-weight:700; color:#334155;">
                      Didn't request this code?
                    </p>

                    <p style="margin:0; font-size:13px; line-height:1.8; color:#64748B;">
                      If you didn't request this code, you can safely ignore this email.
                      Someone else might have typed your email address by mistake.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:30px 25px 35px;">

              <div style="height:1px; background-color:#E8EDF5; margin-bottom:20px;"></div>

              <p style="margin:0; font-size:12px; line-height:1.7; color:#94A3B8;">
                This is an automated email. Please do not reply to this message.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

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
const contactUsAdminTemplate = (values: {
     name: string;
     email: string;
     phone?: string;
     subject: string;
     message: string;
}) => {
     const data = {
          to: 'support@loan.co.uk',
          subject: `New Contact Request: ${values.subject}`,
          html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">      
      <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <h2 style="color: #277E16; font-size: 24px; margin-bottom: 20px; text-align: center;">New Contact Request!</h2>
          
          <div style="padding: 15px; background-color: #f4f4f4; border-radius: 8px; margin: 20px 0;">
              <p style="color: #333; font-size: 16px; font-weight: bold;">User Details:</p>
              <p><strong>Name:</strong> ${values.name}</p>
              <p><strong>Email:</strong> ${values.email}</p>
              <p><strong>Phone:</strong> ${values.phone || 'N/A'}</p>
              <p><strong>Subject:</strong> ${values.subject}</p>
              <br/>
              <p><strong>Message:</strong></p>
              <p>${values.message}</p>
          </div>
      </div>
  </body>`,
     };
     return data;
};

export const emailTemplate = {
     createAccount,
     resetPassword,
     contactFormTemplate,
     contact,
     helpReplyTemplate,
     blockAccountTemplate,
     contactUsAdminTemplate,
};
