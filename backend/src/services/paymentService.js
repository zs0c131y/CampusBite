export const generateUpiLink = (upiId, storeName, amount, orderNumber) => {
  const encodedName = encodeURIComponent(storeName);
  const encodedNote = encodeURIComponent(`CampusBite Order ${orderNumber}`);
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount}&tn=${encodedNote}&cu=INR`;
  return upiLink;
};

export const getUpiAppLinks = (upiLink) => {
  const encodedLink = encodeURIComponent(upiLink);

  return {
    gpay: `tez://upi/${upiLink.replace('upi://', '')}`,
    phonepe: `phonepe://pay?${upiLink.replace('upi://pay?', '')}`,
    paytm: `paytmmp://pay?${upiLink.replace('upi://pay?', '')}`,
    bhim: `bhim://pay?${upiLink.replace('upi://pay?', '')}`,
    generic: upiLink,
  };
};
