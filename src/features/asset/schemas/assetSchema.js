import { ethers } from 'ethers';
import { z } from 'zod';
import { evenlyDividingTiers, PRICE_STEP } from '../../../utils/units';
import { STREAM_KEYS } from '../../../config/incomeStreams';

/**
 * Asset Size / Price are collected as free text (e.g. "4151 Sqft",
 * "$450,000") because that's how the data is naturally written, but
 * `AssetNFT.mintAsset` needs a plain positive uint256 for each.
 * Extracts the leading number so both the validator and the mint call
 * agree on what the field means.
 */
export const parseLeadingNumber = (value) => {
  const match = String(value).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : NaN;
};

const requiredText = (fieldLabel) => z.string().trim().min(1, `${fieldLabel} is required.`);

const numericText = (fieldLabel) =>
  requiredText(fieldLabel)
    .refine((value) => !Number.isNaN(parseLeadingNumber(value)), `${fieldLabel} must contain a number.`)
    .refine((value) => parseLeadingNumber(value) > 0, `${fieldLabel} must be greater than 0.`);

const walletAddress = (fieldLabel) =>
  requiredText(fieldLabel).refine((value) => ethers.utils.isAddress(value), 'Enter a valid wallet address.');

/**
 * Validates the Tokenize Asset form fields before any upload or
 * on-chain call is made. `singleImage` gates the mint step in
 * TokenizeAssetPage, so it's required here too — submitting without it
 * would otherwise silently skip minting while still saving a listing.
 */
export const tokenizeAssetSchema = z.object({
  name: requiredText('Asset Name'),
  // FractionalVault.fractionalizeAsset mints assetPrice / sliceValue
  // shares with no remainder allowed (SHARE_DECIMALS == 0), and sliceValue
  // is only ever offered in $10 steps at fractionalize time — so a price
  // with no evenly-dividing $10 tier can never be fractionalized later.
  // Caught here, at entry, rather than letting the asset mint as a dead
  // end that has to be fixed after the fact.
  assetPrice: numericText('Asset Price').superRefine((value, ctx) => {
    const price = parseLeadingNumber(value);
    if (Number.isNaN(price) || price <= 0) return; // already reported by numericText's own refinements
    if (evenlyDividingTiers(price).length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: `No $${PRICE_STEP}-multiple slice size divides $${price} evenly — choose a value that's a multiple of $${PRICE_STEP}.`,
      });
    }
  }),
  assetSize: numericText('Asset Size'),
  assetOwnerWallet: walletAddress('Asset Owner Wallet'),
  features: requiredText('Features'),
  offering: requiredText('Offering'),
  details: requiredText('Details'),
  management: requiredText('Managed By'),
  location: requiredText('Location'),
  singleImage: z
    .instanceof(File, { message: 'Upload a primary asset image.' })
    .refine((file) => file.size > 0, 'Upload a primary asset image.'),
  // How the land reaches holders and which income streams the owner shares
  // with them each month (a stream not listed is not shared — fixed at 0).
  landModel: z.enum(['RENT', 'APPRECIATION']),
  incomeStreams: z.array(z.enum(STREAM_KEYS)),
}).superRefine((data, ctx) => {
  if (data.landModel === 'APPRECIATION' && data.incomeStreams.includes('LAND_RENT')) {
    ctx.addIssue({
      code: 'custom',
      path: ['incomeStreams'],
      message: 'Land rent can’t be shared when the land is owned by the fuel owner.',
    });
  }
});
