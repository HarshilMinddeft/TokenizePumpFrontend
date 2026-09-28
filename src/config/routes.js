export const ROUTES = {
  home: '/',
  tokenizeProperty: '/tokenize-property',
  fractionalizeProperty: '/fractionalize-property',
  redeemProperty: '/redeem-property',
  listProperty: '/list-property',
  withdrawBuyBack: '/withdraw-buyback',
  updatePrice: '/update-price',
  cancelListing: '/cancel-listing',
  updateBuyBackBPS: '/update-buyback-bps',
  // Public, no-sidebar marketplace for normal visitors who haven't
  // connected a wallet — this is what the landing page links to.
  marketplace: '/marketplace',
  propertyDetails: '/properties/:id',
  // Authenticated mirrors linked from the sidebar (full app shell). Any
  // connected wallet reaches these, not just admins — "app" just means
  // "inside the app", as opposed to the public marketing-site pages above.
  appMarketplace: '/app/marketplace',
  appPropertyDetails: '/app/properties/:id',
};

export const getPropertyDetailsPath = (propertyId) => `/properties/${propertyId}`;
export const getAppPropertyDetailsPath = (propertyId) => `/app/properties/${propertyId}`;
