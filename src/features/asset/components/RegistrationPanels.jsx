import Button from '../../../components/ui/Button';
import contractsConfig from '../../../config/contracts.config';

/** Everything the admin needs to find this asset on-chain later. */
export const MintedIdentifiers = ({ info }) => {
  const rows = [
    ['Asset NFT ID', info.tokenId],
    ['Owner address', info.owner],
    ['NFT address', contractsConfig.assetNft.address],
    ['Compliance contract', info.complianceAddress],
  ];
  return (
    <div className="mt-6 w-full max-w-md space-y-2 rounded-2xl bg-slate-50 p-4 text-left dark:bg-slate-950/60">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4">
          <span className="shrink-0 text-xs font-semibold text-slate-400 dark:text-slate-500">{label}:</span>
          <span className="text-right font-mono text-xs break-all text-slate-600 dark:text-slate-300">{value}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Shown when the NFT is minted but saving it in the backend didn't finish
 * (server or database unreachable, closed tab, …). Not a success: the asset
 * is on-chain but won't appear in listings until this step completes.
 */
export const RegistrationRecovery = ({ info, error, busy, onRetry, onDiscard }) => (
  <div role="alert" className="flex flex-col items-center px-6 py-14 text-center sm:py-16">
    <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/15">
      <svg className="h-8 w-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
    </span>
    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
      NFT minted — registration not finished
    </h2>
    <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
      The asset is on-chain, but VARELO hasn’t saved it yet, so it won’t appear in listings. Nothing needs to be
      minted again — just retry this last step.
    </p>
    {error && (
      <p className="mt-3 max-w-md rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
        {error}
      </p>
    )}

    <MintedIdentifiers info={info} />

    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Button onClick={onRetry} loading={busy}>
        Retry registration
      </Button>
      <Button variant="secondary" onClick={onDiscard} disabled={busy}>
        Start over
      </Button>
    </div>
    <p className="mt-3 max-w-md text-xs text-slate-400 dark:text-slate-500">
      “Start over” forgets this asset in this browser. The NFT stays on-chain — keep the identifiers above.
    </p>
  </div>
);
