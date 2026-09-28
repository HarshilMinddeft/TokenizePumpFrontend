import { useCallback, useEffect, useState } from 'react';

/**
 * Fetches properties via `fetchFn` then keeps only the ones for which
 * `include(property, contract)` resolves truthy. Mirrors the pattern
 * shared by Marketplace/Fractionalize/Redeem pages: pull the list from the
 * backend, then cross-check each entry against a read-only contract.
 *
 * @param {() => Promise<{properties: any[]}>} fetchFn
 * @param {(property: any, contract: import('ethers').Contract) => Promise<boolean>} include
 * @param {() => import('ethers').Contract} getContract
 * @param {any[]} deps - re-fetch when these change (e.g. [address])
 */
export const usePropertiesFilteredBy = (fetchFn, include, getContract, deps = []) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFn();
      const allProps = data.properties || [];
      const contract = getContract();

      const filtered = [];
      for (const prop of allProps) {
        try {
          if (await include(prop, contract)) {
            filtered.push(prop);
          }
        } catch (err) {
          console.error(`Error checking property ${prop.propertyId}:`, err);
        }
      }
      setProperties(filtered);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { properties, loading, refetch, setProperties };
};

export default usePropertiesFilteredBy;
