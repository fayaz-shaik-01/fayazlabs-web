/** Format an amount in paise (1/100 of the currency unit) for display. */
export function formatAmount(amountPaise: number, currency: string): string {
  if (amountPaise === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: amountPaise % 100 === 0 ? 0 : 2,
  }).format(amountPaise / 100);
}
