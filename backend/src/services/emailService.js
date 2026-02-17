import { sendEmail } from '../config/email.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const baseStyles = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
`;

const headerStyles = `
  background-color: #FF6B35;
  color: #ffffff;
  padding: 20px;
  text-align: center;
  border-radius: 8px 8px 0 0;
`;

const bodyStyles = `
  padding: 30px 20px;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
`;

const buttonStyles = `
  display: inline-block;
  padding: 12px 30px;
  background-color: #FF6B35;
  color: #ffffff;
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
  margin: 20px 0;
`;

const footerStyles = `
  text-align: center;
  padding: 15px;
  color: #888888;
  font-size: 12px;
  border-radius: 0 0 8px 8px;
  background-color: #f0f0f0;
`;

const wrapTemplate = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <div style="${baseStyles}">
    <div style="${headerStyles}">
      <h1 style="margin: 0; font-size: 24px;">CampusBite</h1>
      <p style="margin: 5px 0 0 0; font-size: 14px;">Your Campus Food Companion</p>
    </div>
    <div style="${bodyStyles}">
      ${content}
    </div>
    <div style="${footerStyles}">
      <p style="margin: 0;">This is an automated email from CampusBite. Please do not reply.</p>
      <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} CampusBite. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const sendVerificationEmail = async (email, name, token) => {
  const verificationLink = `${FRONTEND_URL}/verify-email/${token}`;

  const content = `
    <h2 style="color: #333333; margin-top: 0;">Welcome, ${name}!</h2>
    <p style="color: #555555; line-height: 1.6;">
      Thank you for registering with CampusBite. Please verify your email address to get started.
    </p>
    <div style="text-align: center;">
      <a href="${verificationLink}" style="${buttonStyles}">Verify Email Address</a>
    </div>
    <p style="color: #888888; font-size: 13px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${verificationLink}" style="color: #FF6B35;">${verificationLink}</a>
    </p>
    <p style="color: #888888; font-size: 13px;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `;

  const html = wrapTemplate(content);
  await sendEmail(email, 'Verify Your CampusBite Account', html);
};

export const sendPasswordResetEmail = async (email, name, token) => {
  const resetLink = `${FRONTEND_URL}/reset-password/${token}`;

  const content = `
    <h2 style="color: #333333; margin-top: 0;">Password Reset Request</h2>
    <p style="color: #555555; line-height: 1.6;">
      Hi ${name}, we received a request to reset your password. Click the button below to create a new password.
    </p>
    <div style="text-align: center;">
      <a href="${resetLink}" style="${buttonStyles}">Reset Password</a>
    </div>
    <p style="color: #888888; font-size: 13px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetLink}" style="color: #FF6B35;">${resetLink}</a>
    </p>
    <p style="color: #888888; font-size: 13px;">
      This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    </p>
  `;

  const html = wrapTemplate(content);
  await sendEmail(email, 'Reset Your CampusBite Password', html);
};

export const sendOrderConfirmation = async (email, name, order) => {
  const itemRows = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">&#8377;${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const content = `
    <h2 style="color: #333333; margin-top: 0;">Order Confirmed!</h2>
    <p style="color: #555555; line-height: 1.6;">
      Hi ${name}, your order has been placed successfully.
    </p>
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p style="margin: 0; color: #333;"><strong>Order Number:</strong> ${order.order_number}</p>
      <p style="margin: 5px 0 0 0; color: #333;"><strong>Store:</strong> ${order.store_name || 'N/A'}</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
      <thead>
        <tr style="background-color: #FF6B35; color: white;">
          <th style="padding: 10px; text-align: left;">Item</th>
          <th style="padding: 10px; text-align: center;">Qty</th>
          <th style="padding: 10px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 10px; font-weight: bold; text-align: right;">Total:</td>
          <td style="padding: 10px; font-weight: bold; text-align: right;">&#8377;${parseFloat(order.total_amount).toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
    <p style="color: #555555; line-height: 1.6;">
      Please complete the payment via UPI to confirm your order. You will receive updates as your order progresses.
    </p>
  `;

  const html = wrapTemplate(content);
  await sendEmail(email, `Order Confirmed - ${order.order_number}`, html);
};

export const sendOrderStatusUpdate = async (email, name, order, status) => {
  const statusMessages = {
    accepted: 'Your order has been accepted by the store and payment has been confirmed.',
    processing: 'Your order is now being prepared.',
    ready: 'Your order is ready for pickup! Please collect it from the store.',
    picked_up: 'Your order has been picked up. Enjoy your meal!',
    cancelled: 'Your order has been cancelled.',
  };

  const statusColors = {
    accepted: '#4CAF50',
    processing: '#2196F3',
    ready: '#FF9800',
    picked_up: '#8BC34A',
    cancelled: '#F44336',
  };

  const content = `
    <h2 style="color: #333333; margin-top: 0;">Order Status Update</h2>
    <p style="color: #555555; line-height: 1.6;">Hi ${name},</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${statusColors[status] || '#FF6B35'};">
      <p style="margin: 0; color: #333;"><strong>Order:</strong> ${order.order_number}</p>
      <p style="margin: 10px 0 0 0; color: #333;">
        <strong>Status:</strong>
        <span style="color: ${statusColors[status] || '#FF6B35'}; font-weight: bold; text-transform: uppercase;">${status.replace('_', ' ')}</span>
      </p>
    </div>
    <p style="color: #555555; line-height: 1.6;">
      ${statusMessages[status] || 'Your order status has been updated.'}
    </p>
  `;

  const html = wrapTemplate(content);
  await sendEmail(email, `Order ${order.order_number} - ${status.replace('_', ' ').toUpperCase()}`, html);
};

export const sendOtpEmail = async (email, name, otp, orderNumber) => {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Your Pickup OTP</h2>
    <p style="color: #555555; line-height: 1.6;">
      Hi ${name}, your order <strong>${orderNumber}</strong> is ready for pickup!
    </p>
    <p style="color: #555555; line-height: 1.6;">
      Please share the following OTP with the store employee when collecting your order:
    </p>
    <div style="text-align: center; margin: 25px 0;">
      <div style="display: inline-block; background-color: #FF6B35; color: #ffffff; padding: 15px 40px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
        ${otp}
      </div>
    </div>
    <p style="color: #888888; font-size: 13px; text-align: center;">
      This OTP is valid for 15 minutes. Do not share it with anyone other than the store employee.
    </p>
  `;

  const html = wrapTemplate(content);
  await sendEmail(email, `Pickup OTP for Order ${orderNumber}`, html);
};
