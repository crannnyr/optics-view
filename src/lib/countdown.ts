export function formatCountdown(target: string | null): { label: string; overdue: boolean } {
  if (!target) return { label: '—', overdue: false };

  const diffMs = new Date(target).getTime() - Date.now();
  const overdue = diffMs <= 0;
  const abs = Math.abs(diffMs);

  const hours = Math.floor(abs / (1000 * 60 * 60));
  const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));

  const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  return {
    label: overdue ? `Overdue by ${duration}` : `${duration} left`,
    overdue,
  };
}
