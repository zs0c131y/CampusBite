import crypto from 'crypto';

export const generateOtp = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

export const getOtpExpiry = () => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 15);
  return expiry;
};

export const validateOtp = (storedOtp, inputOtp, expiresAt) => {
  if (!storedOtp || !inputOtp || !expiresAt) {
    return false;
  }

  if (new Date() > new Date(expiresAt)) {
    return false;
  }

  const a = Buffer.from(String(storedOtp))
  const b = Buffer.from(String(inputOtp))
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
};
