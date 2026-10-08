import { useEffect, useState } from 'react';
import web3Service from '../../../services/web3Service';
import assetApi from '../api/assetApi';

/**
 * Whether the connected wallet owns at least one marketplace listing with a
 * currently open buyback — i.e. whether the "Withdraw Buyback" page would
 * show them anything. Mirrors WithdrawBuyBackPage's own fetch logic (same
 * owner + buyBack check) so the sidebar link only appears for wallets that
 * page would actually be useful to, rather than every connected user.
 */
export const useHasActiveBuyBack = (address) => {
  const [hasBuyBack, setHasBuyBack] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!address) {
        if (!cancelled) {
          setHasBuyBack(false);
          setChecking(false);
        }
        return;
      }

      setChecking(true);
      try {
        const data = await assetApi.getAllMarketplaceAssets();
        const allProps = data.assets || [];
        const marketplace = web3Service.getReadOnlyMarketplaceContract();

        let found = false;
        for (const prop of allProps) {
          const listing = await marketplace.listings(prop.assetId);
          if (listing.owner.toLowerCase() === address.toLowerCase() && listing.buyBack) {
            found = true;
            break;
          }
        }
        if (!cancelled) setHasBuyBack(found);
      } catch (err) {
        console.error('Could not check for an active buyback:', err);
        if (!cancelled) setHasBuyBack(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return { hasBuyBack, checking };
};

export default useHasActiveBuyBack;
