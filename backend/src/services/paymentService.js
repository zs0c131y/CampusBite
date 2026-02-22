const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
const SAFE_TEXT_REGEX = /[^a-zA-Z0-9 .,&()/-]/g;

const formatAmount = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value.toFixed(2);
};

const sanitizeText = (value, maxLength = 40) => {
  if (!value) return "";
  return value
    .toString()
    .replace(SAFE_TEXT_REGEX, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
};

const sanitizeTransactionRef = (value, maxLength = 35) =>
  (value || "")
    .toString()
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, maxLength);

const addOptionalParams = (params) => {
  const merchantCode = (process.env.UPI_MERCHANT_CODE || "").trim();
  if (/^\d{4}$/.test(merchantCode)) {
    params.set("mc", merchantCode);
  }

  const transactionUrl = (process.env.APP_URL || process.env.FRONTEND_URL || "").trim();
  if (/^https?:\/\//i.test(transactionUrl)) {
    params.set("url", transactionUrl);
  }
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

  const paymentRef = sanitizeTransactionRef(orderRef, 35) || "CBPAYMENT";
  const payeeName = sanitizeText(storeName || "CampusBite Store", 40) || "CampusBite Store";
  const note = sanitizeText(`CampusBite ${paymentRef}`, 80) || "CampusBite Payment";
  const params = new URLSearchParams({
    pa: normalizedUpiId,
    pn: payeeName,
    am: formattedAmount,
    cu: "INR",
    tr: paymentRef,
    tn: note,
  });
  addOptionalParams(params);

  return `upi://pay?${params.toString()}`;
};

export const generateUpiCompatibilityLink = (upiId, storeName, amount) => {
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

  const payeeName = sanitizeText(storeName || "CampusBite Store", 40) || "CampusBite Store";
  const params = new URLSearchParams({
    pa: normalizedUpiId,
    pn: payeeName,
    am: formattedAmount,
    cu: "INR",
    tn: "CampusBite Payment",
  });
  addOptionalParams(params);
  return `upi://pay?${params.toString()}`;
};

const toIntentUri = (query, packageName) =>
  `intent://pay?${query}#Intent;scheme=upi;package=${packageName};end`;

export const getUpiAppLinks = (upiLink) => {
  const query = upiLink.replace(/^upi:\/\/pay\?/, "");
  const fallback = encodeURIComponent(upiLink);

  return {
    // Generic UPI deep-link remains primary. Chooser intent helps list installed UPI apps on Android browsers.
    generic: upiLink,
    chooser: `intent://pay?${query}#Intent;scheme=upi;S.browser_fallback_url=${fallback};end`,
    gpay: toIntentUri(query, "com.google.android.apps.nbu.paisa.user"),
    phonepe: toIntentUri(query, "com.phonepe.app"),
    paytm: toIntentUri(query, "net.one97.paytm"),
    bhim: toIntentUri(query, "in.org.npci.upiapp"),
    fallback: upiLink,
  };
};
