export const ROUTES = {
  home: '/',
  tokenizeAsset: '/tokenize-asset',
  fractionalizeAsset: '/fractionalize-asset',
  redeemAsset: '/redeem-asset',
  listAsset: '/list-asset',
  withdrawBuyBack: '/withdraw-buyback',
  updatePrice: '/update-price',
  cancelListing: '/cancel-listing',
  updateBuyBackBPS: '/update-buyback-bps',
  investorDashboard: '/investor-dashboard',
  rentDistribution: '/rent-distribution',
  // Public, no-sidebar marketplace for normal visitors who haven't
  // connected a wallet — this is what the landing page links to.
  marketplace: '/marketplace',
  assetDetails: '/assets/:id',
  // Authenticated mirrors linked from the sidebar (full app shell). Any
  // connected wallet reaches these, not just admins — "app" just means
  // "inside the app", as opposed to the public marketing-site pages above.
  appMarketplace: '/app/marketplace',
  appAssetDetails: '/app/assets/:id',
};

export const getAssetDetailsPath = (assetId) => `/assets/${assetId}`;
export const getAppAssetDetailsPath = (assetId) => `/app/assets/${assetId}`;
