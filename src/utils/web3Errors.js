/**
 * Maps a thrown ethers/web3 error to a short, user-facing message.
 * Checks .reason, .message, and .data.message since ethers v5 populates
 * different fields depending on where the revert/rejection occurred.
 */
const getErrorText = (error) => [error?.reason, error?.message, error?.data?.message].filter(Boolean).join(' ');

/**
 * The contracts revert with custom errors (e.g. `revert BuyBackPriceTooLow()`),
 * which surface as the error name rather than a revert string. Matched by name
 * so the user sees what actually went wrong instead of a generic fallback.
 */
const CUSTOM_ERRORS = {
  BuyBackActive: 'A buyback is already active on this listing.',
  BuyBackNotActive: 'No buyback is active on this listing.',
  BuyBackPriceTooLow: 'The buyback price must be at least 10% above the current listing price.',
  ClaimWindowOpen: 'The 60-day claim window is still open. You can withdraw the escrow after it closes.',
  InsufficientEscrow: 'The buyback escrow cannot cover this amount.',
  NothingToWithdraw: 'There is no escrow left to withdraw.',
  NoOutstandingTokens: 'No shares are held by investors, so there is nothing to buy back.',
  ListingAlreadyActive: 'This asset is already listed.',
  ListingNotActive: 'This listing is not active.',
  NotOwner: 'Only the listing owner can do this.',
  NotAuthorized: 'You are not authorized to do this.',
  NotVaultToken: 'That token is not the share token issued for this asset.',
  VaultNotSet: 'The marketplace is not linked to the vault yet. Please contact support.',
  TokensRemaining: 'There are still tokens remaining on this listing.',
  InvalidAmount: 'Please enter a valid amount.',
  InvalidPrice: 'Please enter a valid price.',
  InvalidTreasury: 'The fee treasury is not configured. Please contact support.',
  ZeroAddress: 'A required address is missing. Please contact support.',
  AlreadyRedeemed: 'These shares have already been redeemed.',
  NotFractionalized: 'This asset has not been fractionalized.',
  ZeroShares: 'You hold no shares to redeem.',
  TransferFailed: 'The token transfer failed.',
  MarketplaceNotSet: 'The vault is not linked to the marketplace yet. Please contact support.',
  ListingNotCancelled: 'Cancel the marketplace listing for this asset before redeeming.',
  SupplyAccountingBroken: 'Something is wrong with this asset\'s share accounting. Please contact support.',
  InvalidOwner: 'This listing owner is not valid.',
  MinBuyBackPremiumNotSet: 'The buyback premium has not been configured yet. Please contact support.',
  BuyBackOpen: 'These shares are eligible for a buyback — cancel the sell order first, then sell them back directly instead of listing on the order book.',
  // RentDistributor
  BatchAlreadyExecuted: 'This rent batch has already been paid on-chain.',
  BatchTooLarge: 'This batch has too many recipients for one transaction.',
  EmptyBatch: 'This batch has no recipients.',
  LengthMismatch: 'Recipients and amounts do not line up.',
  InvalidRecipient: 'One of the recipients is not a valid address.',
  ZeroAmount: 'One of the payouts is zero.',
  AccessControlUnauthorizedAccount: 'This wallet is not allowed to distribute rent (missing DISTRIBUTOR_ROLE).',
  ERC20InsufficientAllowance: 'The stablecoin approval does not cover this batch — approve first.',
  ERC20InsufficientBalance: 'This wallet does not hold enough stablecoin for this batch.',
};

const KNOWN_ERRORS = [
  { match: 'user rejected', text: 'Transaction Rejected.' },
  { match: 'Identity is not verified', text: 'Identity Verification Required. Please complete KYC before continuing.' },
  { match: 'Transfer not possible', text: 'KYC Required' },
  { match: 'cannot estimate gas', text: 'Insufficient funds' },
  { match: 'insufficient funds', text: 'Insufficient funds' },
];

export const getContractErrorMessage = (error, fallback = 'Please try after some time') => {
  const text = getErrorText(error);

  // Rejections are checked first: a user-cancelled transaction can still carry
  // decoded error data from the failed gas estimate that preceded it.
  const known = KNOWN_ERRORS.find(({ match }) => text.includes(match));
  if (known) return known.text;

  const named = error?.errorName || error?.error?.errorName;
  if (named && CUSTOM_ERRORS[named]) return CUSTOM_ERRORS[named];

  const matched = Object.keys(CUSTOM_ERRORS).find((name) =>
    new RegExp(`\\b${name}\\b`).test(text)
  );
  if (matched) return CUSTOM_ERRORS[matched];

  return fallback;
};

export default getContractErrorMessage;
