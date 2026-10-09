import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import StationLanding from '../features/landing/StationLanding';
import TokenizeAssetPage from '../features/asset/pages/TokenizeAssetPage';
import FractionalizePage from '../features/asset/pages/FractionalizePage';
import RedeemTokensPage from '../features/asset/pages/RedeemTokensPage';
import ListMarketplacePage from '../features/asset/pages/ListMarketplacePage';
import MarketplacePage from '../features/asset/pages/MarketplacePage';
import WithdrawBuyBackPage from '../features/asset/pages/WithdrawBuyBackPage';
import UpdatePricePage from '../features/asset/pages/UpdatePricePage';
import CancelListingPage from '../features/asset/pages/CancelListingPage';
import AssetDetailPage from '../features/asset/pages/AssetDetailPage';
import UpdateBuyBackBPS from '../features/asset/pages/UpdateBuyBackBPS';
import RentDistributionPage from '../features/rent/pages/RentDistributionPage';
import { ROUTES, getAssetDetailsPath, getAppAssetDetailsPath } from '../config/routes';
import './App.css';

// Pre-rename URLs (/property/:id, /properties/:id, /app/properties/:id) — kept
// so links and bookmarks shared before assets were renamed still resolve.
const LegacyAssetRedirect = ({ app = false }) => {
  const { id } = useParams();

  return <Navigate to={app ? getAppAssetDetailsPath(id) : getAssetDetailsPath(id)} replace />;
};

function App() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<StationLanding />} />
      <Route path={ROUTES.tokenizeAsset} element={<TokenizeAssetPage />} />
      <Route path={ROUTES.fractionalizeAsset} element={<FractionalizePage />} />
      <Route path={ROUTES.redeemAsset} element={<RedeemTokensPage />} />
      <Route path={ROUTES.listAsset} element={<ListMarketplacePage />} />
      <Route path={ROUTES.withdrawBuyBack} element={<WithdrawBuyBackPage />} />
      <Route path={ROUTES.updatePrice} element={<UpdatePricePage />} />
      <Route path={ROUTES.cancelListing} element={<CancelListingPage />} />

      {/* Public, no-sidebar marketplace for normal visitors browsing
          without a wallet. */}
      <Route path={ROUTES.marketplace} element={<MarketplacePage isPublic />} />
      <Route path={ROUTES.assetDetails} element={<AssetDetailPage isPublic />} />

      {/* Authenticated mirrors linked from the sidebar (full app shell). */}
      <Route path={ROUTES.appMarketplace} element={<MarketplacePage />} />
      <Route path={ROUTES.appAssetDetails} element={<AssetDetailPage />} />

      <Route path={ROUTES.updateBuyBackBPS} element={<UpdateBuyBackBPS />} />
      {/* The investor dashboard is a tab on the marketplace */}
      <Route
        path={ROUTES.investorDashboard}
        element={<Navigate to={`${ROUTES.appMarketplace}?tab=dashboard`} replace />}
      />
      <Route path={ROUTES.rentDistribution} element={<RentDistributionPage />} />

      <Route path="/property/:id" element={<LegacyAssetRedirect />} />
      <Route path="/properties/:id" element={<LegacyAssetRedirect />} />
      <Route path="/app/properties/:id" element={<LegacyAssetRedirect app />} />
    </Routes>
  );
}

export default App;
