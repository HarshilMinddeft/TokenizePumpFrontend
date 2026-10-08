import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AppLayout from '../../../components/layout/AppLayout';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import web3Service from '../../../services/web3Service';
import useAuthorityRole from '../hooks/useAuthorityRole';
import { useWeb3 } from '../../../context/Web3Context';
import { getContractErrorMessage } from '../../../utils/web3Errors';

const SetBuybackPremiumPage = () => {
  const { address } = useWeb3();

  const [currentPremiumBps, setCurrentPremiumBps] = useState(null);
  const [premium, setPremium] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const { isAuthority, checking } = useAuthorityRole(address);

  const loadPremium = useCallback(async () => {
    setLoading(true);

    try {
      const marketplace = web3Service.getReadOnlyMarketplaceContract();

      const bps = await marketplace.minBuyBackPremiumBps();
      const bpsNumber = Number(bps);

      setCurrentPremiumBps(bpsNumber);

      // Display percentage in the input.
      // Example: 1000 bps = 10%
      setPremium((bpsNumber / 100).toString());
    } catch (error) {
      console.error('Error loading buyback premium:', error);
      toast.error('Failed to load the current buyback premium.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthority) {
      loadPremium();
    } else {
      setLoading(false);
    }
  }, [isAuthority, loadPremium]);

  const premiumToBps = (value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return null;
    }

    // Contract expects uint16 bps.
    // 1% = 100 bps.
    const bps = Math.round(numericValue * 100);

    return bps;
  };

  const handleUpdate = async () => {
    const numericPremium = Number(premium);

    if (!premium || !Number.isFinite(numericPremium)) {
      toast.error('Please enter a valid buyback premium.');
      return;
    }

    if (numericPremium <= 0) {
      toast.error('Buyback premium must be greater than 0%.');
      return;
    }

    const bps = premiumToBps(premium);

    if (bps === null || bps <= 0) {
      toast.error('Invalid buyback premium.');
      return;
    }

    if (bps > 65535) {
      toast.error('Buyback premium is too high.');
      return;
    }

    if (currentPremiumBps !== null && bps === currentPremiumBps) {
      toast.info('Buyback premium is already set to this value.');
      return;
    }

    setUpdating(true);

    try {
      const marketplace = await web3Service.getMarketplaceContract();

      const tx = await marketplace.setMinBuyBackPremiumBps(bps);

      toast.info('Transaction submitted. Waiting for confirmation...');

      await tx.wait();

      const updatedBps = await marketplace.minBuyBackPremiumBps();
      const updatedBpsNumber = Number(updatedBps);

      setCurrentPremiumBps(updatedBpsNumber);
      setPremium((updatedBpsNumber / 100).toString());

      toast.success(
        `Buyback premium updated to ${updatedBpsNumber} bps (${updatedBpsNumber / 100}%).`
      );
    } catch (error) {
      console.error('Error updating buyback premium:', error);

      toast.error(
        getContractErrorMessage(
          error,
          'Failed to update the buyback premium. Please try again.'
        )
      );
    } finally {
      setUpdating(false);
    }
  };

  const body = () => {
    if (checking || loading) {
      return (
        <Spinner
          words={[
            'permissions',
            'buyback premium',
            'marketplace',
            'settings',
          ]}
        />
      );
    }

    if (!address) {
      return (
        <EmptyState title="Wallet not connected">
          Connect the admin wallet to change the buyback premium.
        </EmptyState>
      );
    }

    if (!isAuthority) {
      return (
        <EmptyState title="Not authorized">
          This wallet does not hold the required marketplace authority role, so
          it cannot change the buyback premium. Switch to an authorized wallet
          and try again.
        </EmptyState>
      );
    }

    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-6">
            {/* Current value */}
            <div className="rounded-xl bg-slate-50 p-5 dark:bg-slate-800/50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Current minimum buyback premium
                  </p>

                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                    {currentPremiumBps !== null
                      ? `${currentPremiumBps / 100}%`
                      : '—'}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Basis points
                  </p>

                  <p className="mt-1 font-medium text-slate-700 dark:text-slate-200">
                    {currentPremiumBps !== null
                      ? `${currentPremiumBps} bps`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div>
              <label
                htmlFor="buybackPremium"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                New minimum buyback premium
              </label>

              <div className="relative">
                <input
                  id="buybackPremium"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={premium}
                  onChange={(e) => setPremium(e.target.value)}
                  disabled={updating}
                  placeholder="10"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400">
                  %
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Enter the premium as a percentage. For example, 10% is stored
                on-chain as 1000 bps.
              </p>
            </div>

            {/* Preview */}
            {premium && Number.isFinite(Number(premium)) && Number(premium) > 0 && (
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    New premium
                  </span>

                  <span className="font-medium text-slate-900 dark:text-white">
                    {premium}%
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    On-chain value
                  </span>

                  <span className="font-medium text-slate-900 dark:text-white">
                    {premiumToBps(premium)} bps
                  </span>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
              Changing this value affects the minimum buyback premium used by
              the marketplace. Make sure the new value is correct before
              confirming the transaction.
            </div>

            {/* Update button */}
            <Button
              fullWidth
              onClick={handleUpdate}
              disabled={
                updating ||
                !premium ||
                !Number.isFinite(Number(premium)) ||
                Number(premium) <= 0 ||
                premiumToBps(premium) > 65535 ||
                (currentPremiumBps !== null &&
                  premiumToBps(premium) === currentPremiumBps)
              }
            >
              {updating
                ? 'Updating…'
                : currentPremiumBps !== null &&
                    premiumToBps(premium) === currentPremiumBps
                  ? 'Premium unchanged'
                  : 'Update Buyback Premium'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Administration"
        title="Buyback Premium"
        description="Configure the minimum buyback premium for the marketplace. Requires the marketplace admin role."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-3 3 3 3-3M6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 6.75 4.5Z"
          />
        }
      />

      {body()}
    </AppLayout>
  );
};

export default SetBuybackPremiumPage;
