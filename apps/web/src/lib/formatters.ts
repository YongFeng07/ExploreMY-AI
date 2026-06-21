export function formatCurrency(amount: number, currency = 'MYR'): string {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
}
export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}
export function formatDuration(min: number): string {
  if (min < 60) return `${min}min`; const h = Math.floor(min / 60); const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-MY', { weekday: 'short', month: 'short', day: 'numeric' });
}
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}
