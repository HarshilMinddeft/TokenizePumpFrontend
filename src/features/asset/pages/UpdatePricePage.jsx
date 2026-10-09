import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AppLayout from '../../../components/layout/AppLayout';
import RepriceConsole from '../components/RepriceConsole';
import PageHeader from '../../../components/ui/PageHeader';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import web3Service from '../../../services/web3Service';
import assetApi from '../api/assetApi';
import useAuthorityRole from '../hooks/useAuthorityRole';
import { useWeb3 } from '../../../context/Web3Context';
import { getContractErrorMessage } from '../../../utils/web3Errors';
import { formatShares, formatStable, parseStablePrice } from '../../../utils/units';

const UpdatePricePage = () => {
  const { address } = useWeb3();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthority, checking } = useAuthorityRole(address);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assetApi.getAllMarketplaceAssets();
      const allProps = data.assets || [];
      const marketplace = web3Service.getReadOnlyMarketplaceContract();
      const vault = web3Service.getReadOnlyVaultContract();

      const active = [];
      for (const prop of allProps) {
        try {
          const listing = await marketplace.listings(prop.assetId);
          if (!listing.active) continue;
          // Slice size = station value ÷ all shares, for the premium/discount line.
          const { totalShares } = await vault.fractionalData(prop.assetId);
          const sliceValue = totalShares.isZero() ? null : Number(prop.assetPrice) / Number(formatShares(totalShares));

          active.push({
            asset: prop,
            sliceValue,
            listing: {
              tokenId: prop.assetId,
              pricePerToken: formatStable(listing.pricePerToken),
              totalTokens: formatShares(listing.totalTokens),
              remainingTokens: formatShares(listing.remainingTokens),
              buyBack: listing.buyBack,
            },
          });
        } catch (err) {
          console.error(`Error reading listing ${prop.assetId}:`, err);
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
    // Any positive USDC amount (≤ 6 decimals) — the grade buttons are just
    // shortcuts; the admin can also type a custom price.
    const priceUnits = parseStablePrice(String(price));
    if (!priceUnits) {
      toast.error('Enter a price above 0, with at most 6 decimals.');
      return;
    }

    try {
      const marketplace = await web3Service.getMarketplaceContract();
      const tx = await marketplace.updateAssetPrice(tokenId, priceUnits);
      await tx.wait();

      toast.success(`Price updated to $${price} per share.`);
      load();
    } catch (error) {
      console.error('Error updating asset price:', error);
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
      <div className="space-y-6">
        {rows.map(({ asset, listing, sliceValue }) => (
          <RepriceConsole
            key={`${listing.tokenId}-${listing.pricePerToken}`}
            asset={asset}
            listing={listing}
            sliceValue={sliceValue}
            onUpdate={(price) => updatePrice(listing.tokenId, price)}
          />
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Administration"
        title="Station Price Sign"
        description="Change the price per share of live listings — like updating the price on a station sign. The new price applies to shares still on sale; shares already bought are unaffected. Requires the marketplace authority role."
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
