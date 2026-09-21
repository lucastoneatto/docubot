/** Costs in dollars with 4 decimals: per-message amounts are fractions of a cent. */
export const money = (value: number) => `$${value.toFixed(4)}`;

/** Human-readable file size (bytes -> B/KB/MB/GB). */
export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}
