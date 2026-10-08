import { ROUTES } from './routes';

/* Navigation model shared by the sidebar and top bar. */

export const NAV_GROUPS = [
  {
    id: 'explore',
    label: 'Explore',
    items: [
      {
        path: ROUTES.appMarketplace,
        label: 'Marketplace',
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
          />
        ),
      },
    ],
  },
  {
    id: 'portfolio',
    label: 'Your assets',
    items: [
      {
        path: ROUTES.fractionalizeAsset,
        label: 'Fractionalize',
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
          />
        ),
      },
      {
        path: ROUTES.listAsset,
        label: 'List to Marketplace',
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3h1.5v3A2.25 2.25 0 0 0 6.75 8.25h13.5m-13.5 0a2.25 2.25 0 0 1-2.25 2.25m13.5 0v3a2.25 2.25 0 0 1-2.25 2.25H10.5m-9 9h6m0 0v-6m0 6H3m3 0a2.25 2.25 0 0 1-2.25-2.25V15m13.5-9.75v-1.5A2.25 2.25 0 0 0 15 2.25H9a2.25 2.25 0 0 0-2.25 2.25v1.5"
          />
        ),
      },
      {
        path: ROUTES.redeemAsset,
        label: 'Redeem Asset',
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        ),
      },
      {
        path: ROUTES.cancelListing,
        label: 'Cancel Listing',
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        ),
      },
      {
        path: ROUTES.withdrawBuyBack,
        label: 'Withdraw Buyback',
        // Only useful to a wallet that actually owns a listing with an open
        // buyback — hidden from everyone else rather than linking to a page
        // that would just show "No active buybacks".
        requiresActiveBuyBack: true,
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z"
          />
        ),
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    adminOnly: true,
    items: [
      {
        path: ROUTES.tokenizeAsset,
        label: 'Tokenize Asset',
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15m15 0a8.25 8.25 0 0 0-2.25-5.587M19.5 12a8.25 8.25 0 0 1-2.25 5.587M4.5 12a8.25 8.25 0 0 1 2.25-5.587M4.5 12a8.25 8.25 0 0 0 2.25 5.587"
          />
        ),
      },
      {
        path: ROUTES.updatePrice,
        label: 'Change Asset Price',
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M2.25 9h8.25M2.25 12.75h6M12 3v3.75m0 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm7.5 3.75h.008v.008h-.008V6.75Z"
          />
        ),
      },
      {
        path: ROUTES.updateBuyBackBPS,
        label: 'Update Buyback BPS',
        icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 12h12M6 12a2.25 2.25 0 1 1-4.5 0A2.25 2.25 0 0 1 6 12Zm12 0a2.25 2.25 0 1 1 4.5 0A2.25 2.25 0 0 1 18 12ZM12 6h6m-6 0a2.25 2.25 0 1 1-4.5 0A2.25 2.25 0 0 1 12 6Zm0 12h6m-6 0a2.25 2.25 0 1 1-4.5 0A2.25 2.25 0 0 1 12 18Z"
        />
        ),
      },
    ],
  },
];

/* Page meta for the top bar context line */
export const PAGE_META = {
  [ROUTES.marketplace]: { title: 'Marketplace', section: 'Explore' },
  [ROUTES.appMarketplace]: { title: 'Marketplace', section: 'Explore' },
  [ROUTES.fractionalizeAsset]: { title: 'Fractionalize Asset', section: 'Your assets' },
  [ROUTES.listAsset]: { title: 'List to Marketplace', section: 'Your assets' },
  [ROUTES.redeemAsset]: { title: 'Redeem Asset', section: 'Your assets' },
  [ROUTES.cancelListing]: { title: 'Cancel Listing', section: 'Your assets' },
  [ROUTES.withdrawBuyBack]: { title: 'Withdraw Buyback', section: 'Your assets' },
  [ROUTES.tokenizeAsset]: { title: 'Tokenize Asset', section: 'Administration' },
  [ROUTES.updatePrice]: { title: 'Change Asset Price', section: 'Administration' },
  [ROUTES.updateBuyBackBPS]: { title: 'Update Buyback BPS', section: 'Administration' },
};

export const getPageMeta = (pathname) => {
  if (pathname.startsWith('/assets/') || pathname.startsWith('/app/assets/')) {
    return { title: 'Asset details', section: 'Marketplace' };
  }
  return PAGE_META[pathname] || { title: 'Dashboard', section: 'VARELO' };
};

export const flattenNavItems = (isAdmin) =>
  NAV_GROUPS.filter((g) => !g.adminOnly || isAdmin).flatMap((g) => g.items);
