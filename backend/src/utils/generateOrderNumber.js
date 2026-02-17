import crypto from 'crypto';

const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const randomChars = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CB-${dateStr}-${randomChars}`;
};

export default generateOrderNumber;
