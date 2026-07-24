// Commission applies to the item price only — shipping is a pass-through
// cost the seller incurs, so they keep 100% of the flat shipping fee.
export function computeTransactionPricing(opts: {
  itemSubtotal: number;
  shippingFee: number;
  commissionPercent: number;
}) {
  const totalAmount = round2(opts.itemSubtotal + opts.shippingFee);
  const commissionAmount = round2(opts.itemSubtotal * (opts.commissionPercent / 100));
  const sellerPayoutAmount = round2(totalAmount - commissionAmount);
  return { totalAmount, commissionAmount, sellerPayoutAmount };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
