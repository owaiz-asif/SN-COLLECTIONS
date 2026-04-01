import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_FROM,
    pass: process.env.MAIL_PASSWORD
  }
});

export async function sendOTPEmail(email, otp, purpose = 'verification') {
  try {
    const subject = purpose === 'admin_login' 
      ? 'Admin Login OTP - SN COLLECTIONS'
      : purpose === 'forgot_password'
      ? 'Password Reset OTP - SN COLLECTIONS'
      : 'Email Verification OTP - SN COLLECTIONS';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #7DAACB 0%, #E8D5C4 100%); }
          .content { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .brand { font-size: 28px; font-weight: bold; color: #7DAACB; margin: 0; }
          .otp-box { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; border: 2px dashed #7DAACB; }
          .otp-code { font-size: 36px; font-weight: bold; color: #7DAACB; letter-spacing: 8px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="header">
              <h1 class="brand">SN COLLECTIONS</h1>
              <p style="color: #666; font-size: 14px;">Premium Jewelry Collection</p>
            </div>
            <h2 style="color: #333;">Your OTP Code</h2>
            <p>Hello,</p>
            <p>Your One-Time Password (OTP) for ${purpose.replace('_', ' ')} is:</p>
            <div class="otp-box">
              <p style="margin: 0; color: #666; font-size: 14px;">OTP Code</p>
              <div class="otp-code">${otp}</div>
            </div>
            <p style="color: #666; font-size: 14px;">⏱️ This OTP is valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.</p>
            <p style="color: #666; font-size: 14px;">🔒 If you did not request this OTP, please ignore this email.</p>
            <div class="footer">
              <p>📞 Contact: 8660109399</p>
              <p>© 2025 SN COLLECTIONS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"SN COLLECTIONS" <${process.env.MAIL_FROM}>`,
      to: email,
      subject: subject,
      html: html
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

export default transporter;
