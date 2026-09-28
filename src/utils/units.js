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
 * Price tiers that divide `propertyPrice` evenly — the only base prices
 * FractionalVault.fractionalizeProperty can use, since it mints whole
 * shares only (propertyPrice / basePrice must have no remainder).
 */
export const evenlyDividingTiers = (propertyPrice) => {
  const price = Number(propertyPrice);
  if (!Number.isFinite(price) || price <= 0) return [];
  return PRICE_TIERS.filter((tier) => price % tier === 0);
};

/** UI share amount -> on-chain BigNumber. */
export const parseShares = (amount) =>
  ethers.utils.parseUnits(String(amount), SHARE_DECIMALS);

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
