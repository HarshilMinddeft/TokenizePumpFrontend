import CopyButton from '../../../components/ui/CopyButton';
import { shortenAddress } from '../../../lib/utils';
import { addressUrl, txUrl } from '../utils/format';

/** Shortened tx hash or address, linking to the explorer when configured. */
const ChainLink = ({ hash, address, copy = false }) => {
  const value = hash || address;
  if (!value) return <span className="text-slate-400">—</span>;
  const href = hash ? txUrl(hash) : addressUrl(address);
  const label = shortenAddress(value, 6, 4);

  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-xs">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:underline dark:text-indigo-400"
        >
          {label}
        </a>
      ) : (
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
      )}
      {copy && <CopyButton value={value} label="Copy" />}
    </span>
  );
};

export default ChainLink;
