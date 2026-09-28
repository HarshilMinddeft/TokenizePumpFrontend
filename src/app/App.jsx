import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import StationLanding from '../features/landing/StationLanding';
import TokenizePropertyPage from '../features/property/pages/TokenizePropertyPage';
import FractionalizePage from '../features/property/pages/FractionalizePage';
import RedeemTokensPage from '../features/property/pages/RedeemTokensPage';
import ListMarketplacePage from '../features/property/pages/ListMarketplacePage';
import MarketplacePage from '../features/property/pages/MarketplacePage';
import WithdrawBuyBackPage from '../features/property/pages/WithdrawBuyBackPage';
import UpdatePricePage from '../features/property/pages/UpdatePricePage';
import CancelListingPage from '../features/property/pages/CancelListingPage';
import PropertyDetailPage from '../features/property/pages/PropertyDetailPage';
import UpdateBuyBackBPS from '../features/property/pages/UpdateBuyBackBPS';
import { ROUTES, getPropertyDetailsPath } from '../config/routes';
import './App.css';

const LegacyPropertyRedirect = () => {
  const { id } = useParams();

  return <Navigate to={getPropertyDetailsPath(id)} replace />;
};

function App() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<StationLanding />} />
      <Route path={ROUTES.tokenizeProperty} element={<TokenizePropertyPage />} />
      <Route path={ROUTES.fractionalizeProperty} element={<FractionalizePage />} />
      <Route path={ROUTES.redeemProperty} element={<RedeemTokensPage />} />
      <Route path={ROUTES.listProperty} element={<ListMarketplacePage />} />
      <Route path={ROUTES.withdrawBuyBack} element={<WithdrawBuyBackPage />} />
      <Route path={ROUTES.updatePrice} element={<UpdatePricePage />} />
      <Route path={ROUTES.cancelListing} element={<CancelListingPage />} />

      {/* Public, no-sidebar marketplace for normal visitors browsing
          without a wallet. */}
      <Route path={ROUTES.marketplace} element={<MarketplacePage isPublic />} />
      <Route path={ROUTES.propertyDetails} element={<PropertyDetailPage isPublic />} />

      {/* Authenticated mirrors linked from the sidebar (full app shell). */}
      <Route path={ROUTES.appMarketplace} element={<MarketplacePage />} />
      <Route path={ROUTES.appPropertyDetails} element={<PropertyDetailPage />} />

      <Route path={ROUTES.updateBuyBackBPS} element={<UpdateBuyBackBPS />} />

      <Route path="/property/:id" element={<LegacyPropertyRedirect />} />
    </Routes>
  );
}

export default App;
