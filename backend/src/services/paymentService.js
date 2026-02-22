const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

const formatAmount = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value.toFixed(2);
};

export const isValidUpiId = (upiId) => {
  if (!upiId || typeof upiId !== "string") return false;
  return UPI_ID_REGEX.test(upiId.trim());
};

export const generateUpiLink = (upiId, storeName, amount, orderRef) => {
  const normalizedUpiId = (upiId || "").trim().toLowerCase();
  if (!isValidUpiId(normalizedUpiId)) {
    const error = new Error("Store UPI ID is invalid. Please contact the store.");
    error.statusCode = 400;
    throw error;
  }

  const formattedAmount = formatAmount(amount);
  if (!formattedAmount) {
    const error = new Error("Invalid payment amount.");
    error.statusCode = 400;
    throw error;
  }

  const paymentRef = (orderRef || "").trim().slice(0, 35) || "CBPAYMENT";
  const params = new URLSearchParams({
    pa: normalizedUpiId,
    pn: (storeName || "CampusBite Store").trim(),
    am: formattedAmount,
    cu: "INR",
    tr: paymentRef,
    tn: `CampusBite Order ${paymentRef}`,
  });

  return `upi://pay?${params.toString()}`;
};

export const getUpiAppLinks = (upiLink) => {
  const query = upiLink.replace(/^upi:\/\/pay\?/, "");

  return {
    // Generic UPI deep-link is the most interoperable option across apps.
    generic: upiLink,
    gpay: `tez://upi/pay?${query}`,
    phonepe: `phonepe://pay?${query}`,
    paytm: `paytmmp://pay?${query}`,
    bhim: `upi://pay?${query}`,
  };
};
