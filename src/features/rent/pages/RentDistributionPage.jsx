import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AppLayout from '../../../components/layout/AppLayout';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/ui/Spinner';
import { useWeb3 } from '../../../context/Web3Context';
import web3Service from '../../../services/web3Service';
import contractsConfig from '../../../config/contracts.config';
import { getContractErrorMessage } from '../../../utils/web3Errors';
import rentApi, { apiErrorMessage, isUnauthorized } from '../api/rentApi';
import useAdminSession from '../hooks/useAdminSession';
import AdminSignIn from '../components/AdminSignIn';
import DistributionForm from '../components/DistributionForm';
import DistributionDetail from '../components/DistributionDetail';
import DataTable from '../components/DataTable';
import { DISTRIBUTION_TONES, formatDate, formatMoney, formatMonth } from '../utils/format';

const HISTORY_PAGE_SIZE = 10;

const Icon = ({ d }) => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const RentDistributionPage = () => {
  const { address } = useWeb3();
  const session = useAdminSession(address);
  // Destructured so effects depend on these stable values, not on the hook's
  // return object (a new object every render).
  const { token, clear: clearSession } = session;

  const [overview, setOverview] = useState(null);
  const [assets, setAssets] = useState([]);
  const [history, setHistory] = useState({ items: [], total: 0, page: 1 });
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState('');

  /** Wraps a backend call: a 401 drops the session so the sign-in shows again. */
  const guard = useCallback(
    async (fn, fallback) => {
      try {
        return await fn();
      } catch (err) {
        if (isUnauthorized(err)) {
          clearSession();
          toast.info('Your admin session expired — sign in again.');
        } else {
          toast.error(apiErrorMessage(err, fallback));
        }
        return undefined;
      }
    },
    [clearSession],
  );

  const loadOverview = useCallback(async () => {
    if (!token) return;
    const data = await guard(() => rentApi.getOverview(token), 'Could not load the overview.');
    if (data) setOverview(data);
  }, [token, guard]);

  const loadHistory = useCallback(
    async (page = 1) => {
      if (!token) return;
      const data = await guard(
        () => rentApi.listDistributions(token, { page, limit: HISTORY_PAGE_SIZE }),
        'Could not load past distributions.',
      );
      if (data) setHistory({ items: data.items, total: data.total, page });
    },
    [token, guard],
  );

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const props = await guard(() => rentApi.getAssets(token), 'Could not load assets.');
    if (props) setAssets(props);
    await Promise.all([loadOverview(), loadHistory(1)]);
    setLoading(false);
  }, [token, guard, loadOverview, loadHistory]);

  useEffect(() => {
    setDetail(null);
    setOverview(null);
    loadAll();
  }, [loadAll]);

  const loadHolders = useCallback(
    (tokenId) => guard(() => rentApi.getHolders(token, tokenId), 'Could not load holders.'),
    [token, guard],
  );

  const loadAssetDistributions = useCallback(
    (tokenId) => guard(() => rentApi.listDistributions(token, { tokenId, limit: 100 }), 'Could not load past distributions.'),
    [token, guard],
  );

  const loadStreams = useCallback(
    (tokenId) => guard(() => rentApi.getAssetStreams(token, tokenId), 'Could not load the income streams.'),
    [token, guard],
  );

  const saveStreams = useCallback(
    (tokenId, payload) => guard(() => rentApi.updateAssetStreams(token, tokenId, payload), 'Could not save the income streams.'),
    [token, guard],
  );

  /** After a settings change, re-read the assets so the form shows the new streams. */
  const refreshAssets = useCallback(async () => {
    const list = await guard(() => rentApi.getAssets(token), 'Could not reload assets.');
    if (list) setAssets(list);
  }, [token, guard]);

  const signIn = async () => {
    try {
      await session.signIn();
      toast.success('Signed in as admin');
    } catch (err) {
      if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') toast.info('Signature cancelled');
      else toast.error(apiErrorMessage(err, getContractErrorMessage(err, 'Sign-in failed')));
    }
  };

  const openDistribution = async (id) => {
    const data = await guard(() => rentApi.getDistribution(token, id), 'Could not load that distribution.');
    if (data) {
      setDetail(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const create = async (payload) => {
    setCreating(true);
    const data = await guard(() => rentApi.createDistribution(token, payload), 'Could not calculate the distribution.');
    setCreating(false);
    if (data) {
      setDetail(data);
      toast.success('Draft ready — review it, then pay out.');
      loadAll();
    }
  };

  const refreshDetail = (data) => {
    if (data) setDetail(data);
    loadHistory(history.page);
    loadOverview();
  };

  const sync = async () => {
    setBusy('sync');
    refreshDetail(await guard(() => rentApi.syncDistribution(token, detail.distribution._id), 'Could not refresh.'));
    setBusy('');
  };

  const cancel = async () => {
    if (!window.confirm('Cancel this draft? You can create a new one for the same month afterwards.')) return;
    setBusy('cancel');
    const data = await guard(() => rentApi.cancelDistribution(token, detail.distribution._id), 'Could not cancel.');
    setBusy('');
    if (data) {
      toast.success('Draft cancelled');
      setDetail(null);
      loadAll();
    }
  };

  const approve = async (amount) => {
    setBusy('approve');
    try {
      await web3Service.ensureRobinhoodNetwork();
      const stable = await web3Service.getStableCoinContract();
      const tx = await stable.approve(contractsConfig.rentDistributor.address, amount.toString());
      toast.info('Approval sent — waiting for confirmation…');
      await tx.wait();
      toast.success('Approved');
      await loadOverview();
    } catch (err) {
      toast.error(getContractErrorMessage(err, 'Approval failed.'));
    } finally {
      setBusy('');
    }
  };

  const signBatch = async (batch) => {
    const id = detail.distribution._id;
    setBusy(`batch-${batch.batchIndex}`);
    try {
      await web3Service.ensureRobinhoodNetwork();

      // The approval may have been spent or changed since the overview loaded.
      const allowance = await web3Service
        .getReadOnlyStableCoinContract()
        .allowance(address, contractsConfig.rentDistributor.address);
      if (allowance.lt(batch.call.total)) {
        toast.error('The approval no longer covers this batch — approve again first.');
        await loadOverview();
        return;
      }

      const { batchId, tokenId, recipients, amounts, platformFee } = batch.call.args;
      const distributor = await web3Service.getRentDistributorContract();
      const tx = await distributor.distribute(batchId, tokenId, recipients, amounts, platformFee);

      // Record the hash before waiting, so the backend can reconcile the batch
      // even if this tab is closed while the tx confirms.
      await guard(() => rentApi.submitBatch(token, id, batch.batchIndex, tx.hash), 'Could not record the transaction.');
      toast.info(`Batch ${batch.batchIndex + 1} sent — waiting for confirmation…`);

      await tx.wait();
      const data = await guard(() => rentApi.syncDistribution(token, id), 'Could not refresh.');
      refreshDetail(data);
      const paid = data?.batches.find((b) => b.batchIndex === batch.batchIndex)?.status === 'PAID';
      if (paid) toast.success(`Batch ${batch.batchIndex + 1} paid`);
      else toast.info('Transaction confirmed — status will update once it is indexed.');
    } catch (err) {
      toast.error(getContractErrorMessage(err, 'The payout transaction failed.'));
      refreshDetail(await guard(() => rentApi.syncDistribution(token, id), 'Could not refresh.'));
    } finally {
      setBusy('');
    }
  };

  const historyColumns = [
    { key: 'month', header: 'Month', render: (d) => <span className="font-medium">{formatMonth(d.month)}</span> },
    { key: 'asset', header: 'Asset', render: (d) => d.assetName || `Asset #${d.tokenId}` },
    { key: 'rent', header: 'Rent', align: 'right', render: (d) => formatMoney(d.rent, overview?.stablecoin?.decimals) },
    { key: 'paid', header: 'To holders', align: 'right', render: (d) => formatMoney(d.netPaid, overview?.stablecoin?.decimals) },
    { key: 'fee', header: 'Fee', align: 'right', render: (d) => formatMoney(d.fee, overview?.stablecoin?.decimals) },
    { key: 'holders', header: 'Paid', align: 'right', render: (d) => d.payableCount },
    { key: 'status', header: 'Status', render: (d) => <Badge tone={DISTRIBUTION_TONES[d.status]} dot>{d.status.replace('_', ' ')}</Badge> },
    { key: 'created', header: 'Created', render: (d) => formatDate(d.createdAt) },
    {
      key: 'open',
      header: '',
      align: 'right',
      render: (d) => (
        <Button size="sm" variant="soft" onClick={() => openDistribution(d._id)}>
          View
        </Button>
      ),
    },
  ];

  const content = () => {
    if (!address) {
      return (
        <EmptyState title="Wallet not connected">
          Connect an admin wallet to distribute rent to asset token holders.
        </EmptyState>
      );
    }
    if (!token) return <AdminSignIn onSignIn={signIn} signingIn={session.signingIn} />;
    if (loading && !overview) return <Spinner words={['holders', 'fees', 'balances', 'holders']} />;

    const decimals = overview?.stablecoin?.decimals ?? 6;
    const symbol = overview?.stablecoin?.symbol ?? '';
    const lag = overview?.subgraph?.lagSeconds ?? 0;

    return (
      <div className="space-y-6">
        {overview && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Indexer"
              value={overview.subgraph.hasIndexingErrors ? 'Error' : lag < 120 ? 'Synced' : 'Catching up'}
              sub={`Block ${overview.subgraph.number.toLocaleString('en-US')} · ${lag}s behind`}
              tone={overview.subgraph.hasIndexingErrors ? 'danger' : lag < 120 ? 'success' : 'warning'}
              icon={<Icon d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />}
            />
            <StatCard
              label="Rent fee"
              value={`${(overview.fee.feeBps / 100).toFixed(2)}%`}
              sub={`saleServicerFeeBps · version ${overview.fee.feeVersion}`}
              tone="brand"
              icon={<Icon d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z" />}
            />
            <StatCard
              label={`Your ${symbol}`}
              value={formatMoney(overview.admin.stablecoinBalance, decimals)}
              sub={overview.admin.canSign ? 'Can sign payouts' : 'Missing DISTRIBUTOR_ROLE'}
              tone={overview.admin.canSign ? 'success' : 'danger'}
              icon={<Icon d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />}
            />
            <StatCard
              label="Paid to holders"
              value={formatMoney(overview.distributions.totalNetPaid, decimals)}
              sub={`${overview.distributions.byStatus.COMPLETED ?? 0} completed · fees ${formatMoney(overview.distributions.totalFees, decimals)}`}
              tone="success"
              icon={<Icon d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />}
            />
          </div>
        )}

        {detail ? (
          <DistributionDetail
            detail={detail}
            overview={overview}
            address={address}
            busy={busy}
            onApprove={approve}
            onSignBatch={signBatch}
            onCancel={cancel}
            onSync={sync}
            onClose={() => setDetail(null)}
          />
        ) : (
          <DistributionForm
            assets={assets}
            allowCurrentMonth={overview?.allowCurrentMonth}
            feeBps={overview?.fee?.feeBps ?? 0}
            symbol={symbol}
            decimals={decimals}
            onCreate={create}
            creating={creating}
            loadHolders={loadHolders}
            loadDistributions={loadAssetDistributions}
            loadStreams={loadStreams}
            saveStreams={saveStreams}
            onStreamsSaved={refreshAssets}
            adminAddress={address}
          />
        )}

        <DataTable
          title="Distributions"
          subtitle="Every monthly distribution, newest first."
          columns={historyColumns}
          rows={history.items}
          rowKey={(d) => d._id}
          empty="No distributions yet."
          pagination={{ page: history.page, limit: HISTORY_PAGE_SIZE, total: history.total, onPage: loadHistory }}
        />
      </div>
    );
  };

  return (
    <AppLayout maxWidth="1280px">
      <PageHeader
        eyebrow="Administration"
        title="Rent Distribution"
        description="Split an asset's monthly rent across its token holders by how many shares they held and for how long, then pay everyone from your wallet in one transaction per batch."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
          />
        }
        action={
          token && (
            <>
              {detail && (
                <Button size="sm" variant="soft" onClick={() => setDetail(null)}>
                  New distribution
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={session.signOut}>
                Sign out
              </Button>
            </>
          )
        }
      />
      {content()}
    </AppLayout>
  );
};

export default RentDistributionPage;
