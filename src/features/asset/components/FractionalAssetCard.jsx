import { toast } from 'react-toastify';
import { cn } from '../../../lib/utils';

/**
 * FractionalAssetCard — dark-themed asset card for the fractional marketplace.
 * @param {object} asset { image, location, title, totalValue, fractionPrice, fundedPercent, apy }
 */
const FractionalAssetCard = ({ asset, onInvest, className = '' }) => {
  const { image, location, title, totalValue, fractionPrice, fundedPercent = 0, apy } = asset;

  const handleInvest = () => {
    toast.success('Connecting to asset contract...');
    onInvest?.(asset);
  };

  return (
    <div
      className={cn(
        'group overflow-hidden rounded-2xl border border-white/10 bg-slate-900',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(0,191,255,0.2)]',
        className,
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-slate-800">
        {image ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900" />
        )}
        <span className="absolute top-3 right-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-teal-400 backdrop-blur-sm">
          {apy}% APY
        </span>
      </div>

      <div className="p-5">
        <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">{location}</p>
        <h3 className="mt-1 truncate text-lg font-bold text-white">{title}</h3>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-400">Total Value</p>
            <p className="text-sm font-medium text-gray-300">${totalValue.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Fraction</p>
            <p className="text-lg font-bold text-sky-400">${fractionPrice}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-400 transition-[width] duration-500"
              style={{ width: `${Math.min(100, Math.max(0, fundedPercent))}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs font-medium text-gray-400">{fundedPercent}% Tokenized</p>
        </div>

        <button
          type="button"
          onClick={handleInvest}
          className="mt-5 w-full rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-400"
        >
          Invest Now
        </button>
      </div>
    </div>
  );
};

export default FractionalAssetCard;
