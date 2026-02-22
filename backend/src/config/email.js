import nodemailer from 'nodemailer';

const hasSmtpConfig =
  !!process.env.SMTP_HOST &&
  !!process.env.SMTP_PORT &&
  !!process.env.SMTP_USER &&
  !!process.env.SMTP_PASS;

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

if (!hasSmtpConfig) {
  console.warn(
    '[Startup] SMTP transporter is disabled because SMTP environment variables are incomplete.'
  );
}

export const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    return null;
  }

  try {
    const mailOptions = {
      from: `"CampusBite" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export default transporter;
