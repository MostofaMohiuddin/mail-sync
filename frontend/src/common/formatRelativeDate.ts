const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function formatRelativeDate(input: string | number | Date, now: Date = new Date()): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60_000) return 'Just now';
  if (diffMs < 60 * 60_000) {
    const m = Math.floor(diffMs / 60_000);
    return `${m}m ago`;
  }
  if (diffMs < 24 * 60 * 60_000) {
    const h = Math.floor(diffMs / (60 * 60_000));
    return `${h}h ago`;
  }

  const dayDiff = Math.floor((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (dayDiff === 1) return 'Yesterday';
  if (dayDiff < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(
    undefined,
    sameYear ? { month: 'short', day: '2-digit' } : { month: 'short', day: '2-digit', year: 'numeric' },
  );
}
