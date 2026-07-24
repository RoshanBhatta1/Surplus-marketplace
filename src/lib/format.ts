export function formatCurrency(amount: number | string | { toString(): string }, currency = "CAD") {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(Number(amount));
}

export function formatQuantity(quantity: number | string, unit: string, unitLabel: string) {
  return `${Number(quantity).toLocaleString("en-CA")} ${unitLabel}`;
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(new Date(date));
}

export function formatRelativeDays(date: Date) {
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat("en-CA", { numeric: "auto" });
  return rtf.format(diffDays, "day");
}
