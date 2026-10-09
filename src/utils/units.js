import { ethers } from 'ethers';

/**
 * Share tokens are whole units — FractionalVault issues them with
 * SHARE_DECIMALS == 0, so one on-chain unit is one share. Amounts are passed
 * to and read from the contracts unscaled.
 */
export const SHARE_DECIMALS = 0;

/** Stablecoin (and therefore every price) carries 6 decimals. */
export const STABLECOIN_DECIMALS = 6;

/**
 * Per-share prices are offered in fixed $10 steps rather than as free input,
 * so listings across the platform stay on comparable price tiers.
 */
export const PRICE_STEP = 10;
export const PRICE_TIERS = Array.from({ length: 10 }, (_, i) => (i + 1) * PRICE_STEP);

/** Whether `price` sits on an allowed tier (a positive multiple of PRICE_STEP). */
export const isValidPriceTier = (price) => {
  const value = Number(price);
  return Number.isFinite(value) && value > 0 && value % PRICE_STEP === 0;
};

/**
 * Price tiers that divide `assetPrice` evenly — the only base prices
 * FractionalVault.fractionalizeAsset can use, since it mints whole
 * shares only (assetPrice / basePrice must have no remainder).
 */
export const evenlyDividingTiers = (assetPrice) => {
  const price = Number(assetPrice);
  if (!Number.isFinite(price) || price <= 0) return [];
  return PRICE_TIERS.filter((tier) => price % tier === 0);
};

/** UI share amount -> on-chain BigNumber. */
export const parseShares = (amount) =>
  ethers.utils.parseUnits(String(amount), SHARE_DECIMALS);

/** What to tell a user who typed something that isn't a whole share count. */
export const WHOLE_SHARES_MESSAGE = 'Shares are whole units — enter a whole number of shares, e.g. 5.';

/**
 * UI share amount -> on-chain BigNumber, or null when it isn't a positive
 * whole number. Shares have no decimals, so "1.5" or "1e3" must be rejected
 * up front instead of failing inside parseUnits.
 */
export const parseWholeShares = (amount) => {
  const text = String(amount ?? '').trim();
  if (!/^\d+$/.test(text)) return null;
  const shares = ethers.BigNumber.from(text);
  return shares.isZero() ? null : shares;
};

/**
 * UI price -> stablecoin units, or null when it isn't a positive amount with
 * at most STABLECOIN_DECIMALS decimals.
 */
export const parseStablePrice = (amount) => {
  const text = String(amount ?? '').trim();
  if (!new RegExp(`^\\d+(\\.\\d{1,${STABLECOIN_DECIMALS}})?$`).test(text)) return null;
  const value = ethers.utils.parseUnits(text, STABLECOIN_DECIMALS);
  return value.isZero() ? null : value;
};

/** On-chain share amount -> display string. */
export const formatShares = (amount) =>
  ethers.utils.formatUnits(amount, SHARE_DECIMALS);

/** UI stablecoin amount -> on-chain BigNumber. */
export const parseStable = (amount) =>
  ethers.utils.parseUnits(String(amount), STABLECOIN_DECIMALS);

/** On-chain stablecoin amount -> display string, trimmed of trailing zeros. */
export const formatStable = (amount) =>
  Number(ethers.utils.formatUnits(amount, STABLECOIN_DECIMALS)).toString();

/**
 * Stablecoin cost of `shares` at `pricePerToken`, both taken as on-chain
 * values. Shares are whole units, so this is a plain product with no scaling
 * to undo — mirroring the contract's own `amount * pricePerToken`.
 */
export const sharesTimesPrice = (shares, pricePerToken) =>
  ethers.BigNumber.from(shares).mul(pricePerToken);
