/** Tiny class-name joiner — no external deps. */
export const cn = (...parts) => parts.filter(Boolean).join(' ');

/** "1,234,567.89" — safe for any numeric string. Returns "—" when invalid. */
export const formatNumber = (value, maxFractionDigits = 2) => {
  const n = Number(value);
  if (value === '' || value === null || value === undefined || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: maxFractionDigits });
};

/** Prepend a $ to a formatted number. */
export const formatUsd = (value, maxFractionDigits = 2) => `$${formatNumber(value, maxFractionDigits)}`;

/** Compact formatter for big token counts, e.g. 1.2M / 84.5K. */
export const formatCompact = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  if (Math.abs(n) >= 10000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

/** Shorten an ethereum address: 0x1234…abcd */
export const shortenAddress = (address, lead = 6, tail = 4) => {
  if (!address) return '';
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
};

/** Expected fractional share count = floor(price / 40), matching the vault flow. */
export const SHARES_PER_DOLLAR_DIVISOR = 40;
export const expectedShares = (assetPrice) =>
  Math.max(0, Math.floor(Number(assetPrice) / SHARES_PER_DOLLAR_DIVISOR));

/** Safe percentage: (part / total) * 100, 0..100 */
export const toPercent = (part, total) => {
  const p = Number(part);
  const t = Number(total);
  if (t <= 0 || Number.isNaN(p) || Number.isNaN(t)) return 0;
  return Math.min(100, Math.max(0, (p / t) * 100));
};

export const isNumeric = (value) => value !== '' && value != null && !Number.isNaN(Number(value));
