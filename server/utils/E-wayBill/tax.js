exports.applyTax = (gstin, customerGSTIN, items = []) => {

  if (!gstin || !customerGSTIN) return items;

  const sameState =
    gstin.substring(0, 2) === customerGSTIN.substring(0, 2);

  return items.map((i) => {
    return sameState
      ? {
          ...i,
          cgst: 9,
          sgst: 9,
          igst: 0,
        }
      : {
          ...i,
          cgst: 0,
          sgst: 0,
          igst: 18,
        };
  });
};