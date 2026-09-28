import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AppLayout from '../../../components/layout/AppLayout';
import PropertyCard from '../components/PropertyCard';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import web3Service from '../../../services/web3Service';
import propertyApi from '../api/propertyApi';
import useAuthorityRole from '../hooks/useAuthorityRole';
import { useWeb3 } from '../../../context/Web3Context';
import { getContractErrorMessage } from '../../../utils/web3Errors';
import { formatShares, formatStable, isValidPriceTier, parseStable, PRICE_STEP, PRICE_TIERS } from '../../../utils/units';

const PriceControls = ({ listing, onUpdate }) => {
  const [price, setPrice] = useState(listing.pricePerToken);
  const [busy, setBusy] = useState(false);

  const unchanged = Number(price) === Number(listing.pricePerToken);

  const handle = async () => {
    setBusy(true);
    try {
      await onUpdate(price);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-slate-500 dark:text-slate-400">Current price</span>
        <span className="font-medium text-slate-700 dark:text-slate-200">
          ${listing.pricePerToken}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-slate-500 dark:text-slate-400">Remaining / total</span>
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {listing.remainingTokens} / {listing.totalTokens}
        </span>
      </div>

      {listing.buyBack ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
          A buyback is active on this listing. The buyback price was fixed against the current price
          when it was funded, so the listing price cannot be changed until it settles.
        </p>
      ) : (
        <>
          <Select label="New price per share" value={price} onChange={(e) => setPrice(e.target.value)}>
            {PRICE_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                ${tier}
              </option>
            ))}
          </Select>
          <Button fullWidth onClick={handle} disabled={busy || unchanged}>
            {busy ? 'Updating…' : unchanged ? 'Price unchanged' : `Update to $${price}`}
          </Button>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Applies to shares still unsold. Shares already bought are unaffected.
          </p>
        </>
      )}
    </div>
  );
};

const UpdatePricePage = () => {
  const { address } = useWeb3();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthority, checking } = useAuthorityRole(address);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await propertyApi.getAllMarketplaceProperties();
      const allProps = data.properties || [];
      const marketplace = web3Service.getReadOnlyMarketplaceContract();

      const active = [];
      for (const prop of allProps) {
        try {
          const listing = await marketplace.listings(prop.propertyId);
          if (!listing.active) continue;

          active.push({
            property: prop,
            listing: {
              tokenId: prop.propertyId,
              pricePerToken: formatStable(listing.pricePerToken),
              totalTokens: formatShares(listing.totalTokens),
              remainingTokens: formatShares(listing.remainingTokens),
              buyBack: listing.buyBack,
            },
          });
        } catch (err) {
          console.error(`Error reading listing ${prop.propertyId}:`, err);
        }
      }
      setRows(active);
    } catch (err) {
      console.error('Error loading listings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthority) load();
    else setLoading(false);
  }, [isAuthority, load]);

  const updatePrice = async (tokenId, price) => {
    if (!isValidPriceTier(price)) {
      toast.error(`Price per share must be a multiple of $${PRICE_STEP}.`);
      return;
    }

    try {
      const marketplace = await web3Service.getMarketplaceContract();
      const tx = await marketplace.updatePropertyPrice(tokenId, parseStable(price));
      await tx.wait();

      toast.success('Property price updated.');
      load();
    } catch (error) {
      console.error('Error updating property price:', error);
      toast.error(getContractErrorMessage(error, 'Failed to update the price. Please try again.'));
    }
  };

  const body = () => {
    if (checking || loading) {
      return <Spinner words={['listings', 'prices', 'permissions', 'listings']} />;
    }

    if (!address) {
      return (
        <EmptyState title="Wallet not connected">
          Connect the authority wallet to change listing prices.
        </EmptyState>
      );
    }

    if (!isAuthority) {
      return (
        <EmptyState title="Not authorized">
          This wallet does not hold the marketplace authority role, so it cannot change listing
          prices. Switch to an authorized wallet and try again.
        </EmptyState>
      );
    }

    if (rows.length === 0) {
      return <EmptyState title="No active listings">There are no active listings to reprice.</EmptyState>;
    }

    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ property, listing }) => (
          <PropertyCard key={listing.tokenId} property={property}>
            <PriceControls
              listing={listing}
              onUpdate={(price) => updatePrice(listing.tokenId, price)}
            />
          </PropertyCard>
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Administration"
        title="Change Property Price"
        description="Reprice active marketplace listings. Requires the marketplace authority role."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        }
      />
      {body()}
    </AppLayout>
  );
};

export default UpdatePricePage;
