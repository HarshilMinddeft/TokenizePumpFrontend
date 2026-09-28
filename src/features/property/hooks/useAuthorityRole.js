import { useEffect, useState } from 'react';
import web3Service from '../../../services/web3Service';
import envConfig from '../../../config/env.config';

/**
 * Whether the connected wallet may change listing prices.
 *
 * The marketplace grants this through AUTHORITY_ROLE, so the role is read
 * from the contract rather than compared against a configured address — a
 * wallet granted the role on-chain works without a redeploy, and one that
 * had it revoked stops seeing controls that would only revert. The configured
 * admin address is kept as a fallback for when the role read fails.
 */
export const useAuthorityRole = (address) => {
  const [isAuthority, setIsAuthority] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!address) {
        if (!cancelled) {
          setIsAuthority(false);
          setChecking(false);
        }
        return;
      }

      setChecking(true);
      try {
        const marketplace = web3Service.getReadOnlyMarketplaceContract();
        const role = await marketplace.AUTHORITY_ROLE();
        const granted = await marketplace.hasRole(role, address);
        if (!cancelled) setIsAuthority(granted);
      } catch (err) {
        console.error('Could not read AUTHORITY_ROLE, falling back to configured admin:', err);
        if (!cancelled) {
          setIsAuthority(address.toLowerCase() === envConfig.adminWalletAddress);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return { isAuthority, checking };
};

export default useAuthorityRole;
