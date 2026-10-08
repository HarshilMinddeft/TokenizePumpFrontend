import { useCallback, useEffect, useState } from 'react';

/**
 * Fetches assets via `fetchFn` then keeps only the ones for which
 * `include(asset, contract)` resolves truthy. Mirrors the pattern
 * shared by Marketplace/Fractionalize/Redeem pages: pull the list from the
 * backend, then cross-check each entry against a read-only contract.
 *
 * @param {() => Promise<{assets: any[]}>} fetchFn
 * @param {(asset: any, contract: import('ethers').Contract) => Promise<boolean>} include
 * @param {() => import('ethers').Contract} getContract
 * @param {any[]} deps - re-fetch when these change (e.g. [address])
 */
export const useAssetsFilteredBy = (fetchFn, include, getContract, deps = []) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFn();
      const allProps = data.assets || [];
      const contract = getContract();

      const filtered = [];
      for (const prop of allProps) {
        try {
          if (await include(prop, contract)) {
            filtered.push(prop);
          }
        } catch (err) {
          console.error(`Error checking asset ${prop.assetId}:`, err);
        }
      }
      setAssets(filtered);
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { assets, loading, refetch, setAssets };
};

export default useAssetsFilteredBy;
