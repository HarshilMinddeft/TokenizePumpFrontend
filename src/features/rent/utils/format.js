import { ethers } from 'ethers';
import envConfig from '../../../config/env.config';

/** Base-unit amount → "1,234.56" (at most `maxFraction` decimals). */
export const formatAmount = (value, decimals = 6, maxFraction = 2) => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(ethers.utils.formatUnits(value, decimals));
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: maxFraction });
};

/** Base-unit amount → "$1,234.56". */
export const formatMoney = (value, decimals = 6, maxFraction = 2) =>
  value === null || value === undefined ? '—' : `$${formatAmount(value, decimals, maxFraction)}`;

export const formatShares = (value) =>
  value === null || value === undefined ? '—' : Number(value).toLocaleString('en-US');

/**
 * Unix seconds (number/string) or ISO date → "Sep 29, 2026". `utc` renders in
 * UTC — distribution periods are UTC months, so local time would mislabel them.
 */
export const formatDate = (value, withTime = false, utc = false) => {
  if (!value) return '—';
  const date = /^\d+$/.test(String(value)) ? new Date(Number(value) * 1000) : new Date(value);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime && { hour: '2-digit', minute: '2-digit' }),
    ...(utc && { timeZone: 'UTC' }),
  });
};

/** "2026-09" → "September 2026". */
export const formatMonth = (month) => {
  if (!month) return '—';
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

const explorerBase = () => (envConfig.robinhoodExplorerUrl || '').replace(/\/$/, '');
export const txUrl = (hash) => (hash && explorerBase() ? `${explorerBase()}/tx/${hash}` : null);
export const addressUrl = (address) => (address && explorerBase() ? `${explorerBase()}/address/${address}` : null);

/** Last few full months (UTC) plus the current one, newest first, as YYYY-MM. */
export const recentMonths = (count = 12) => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
};

export const DISTRIBUTION_TONES = {
  DRAFT: 'neutral',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export const BATCH_TONES = {
  PENDING: 'neutral',
  SUBMITTED: 'warning',
  PAID: 'success',
  FAILED: 'danger',
};

export const ALLOCATION_LABELS = {
  PAYABLE: { label: 'Pending', tone: 'warning' },
  PAID: { label: 'Paid', tone: 'success' },
  SELF_KEPT: { label: 'Kept (admin wallet)', tone: 'info' },
  EXCLUDED_ISSUER: { label: 'Issuer excluded', tone: 'neutral' },
  ZERO: { label: 'Rounds to 0', tone: 'neutral' },
};

export const ACTIVITY_LABELS = {
  FRACTIONALIZED: 'Fractionalized',
  LISTED: 'Listed',
  LISTING_TOPPED_UP: 'Listing topped up',
  LISTING_PRICE_UPDATED: 'Price updated',
  LISTING_CANCELLED: 'Listing cancelled',
  PRIMARY_BUY: 'Marketplace purchase',
  ORDER_CREATED: 'Sell order placed',
  ORDER_FILLED: 'Order filled',
  ORDER_CANCELLED: 'Sell order cancelled',
  BUYBACK_ACTIVATED: 'Buyback opened',
  BUYBACK_SELL: 'Sold back (buyback)',
  BUYBACK_WITHDRAWN: 'Buyback escrow withdrawn',
  REDEEMED: 'Redeemed',
  TRANSFER: 'Transfer',
};
