export function parseAmountInputToMinor(input: string): number {
  const normalized = input.replace(/,/g, '').trim();
  if (!normalized) return 0;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.round(value * 100);
}

export function formatCurrency(minor: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(minor / 100);
}
