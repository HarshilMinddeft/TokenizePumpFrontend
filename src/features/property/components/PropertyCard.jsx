import { cn, formatNumber } from '../../../lib/utils';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

const CameraIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
    />
  </svg>
);

const PinIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
    />
  </svg>
);

const ArrowIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

const imageOf = (property) => property.propertyThumbImages?.[0] || property.propertyImages?.[0];

/**
 * PropertyCard
 * @param {boolean} [clickable] — derived automatically when `onClick` provided
 * @param {React.ReactNode} [children] action/footer content
 */
const PropertyCard = ({ property, onClick, children, className = '', bodyClassName = '' }) => {
  const clickable = Boolean(onClick);
  const image = imageOf(property);

  return (
    <Card
      hover={clickable}
      className={cn('group flex h-full flex-col overflow-hidden', clickable && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {/* Media header */}
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
        {image ? (
          <img
            src={image}
            alt={property.propertyName || 'Property'}
            loading="lazy"
            className={cn(
              'h-full w-full object-cover transition-transform duration-500',
              clickable && 'group-hover:scale-[1.05]',
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 text-slate-300 dark:from-slate-800 dark:to-slate-900 dark:text-slate-600">
            <CameraIcon />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

        <div className="absolute top-3 right-3 left-3 flex items-start justify-between gap-2">
          <Badge tone="brand" className="shadow-sm backdrop-blur">
            {property.locationDetailes ? (
              <span className="flex items-center gap-1 normal-case">
                <PinIcon />
                <span className="max-w-32 truncate">{property.locationDetailes}</span>
              </span>
            ) : (
              'Property'
            )}
          </Badge>
          {clickable && (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow-md backdrop-blur transition-all duration-300 group-hover:opacity-100 dark:bg-slate-900/90 dark:text-white">
              <ArrowIcon />
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="rounded-lg bg-black/45 px-2.5 py-1 text-sm font-bold text-white backdrop-blur-sm">
            ${formatNumber(property.propertyPrice)}
          </span>
          {property.propertyId !== undefined && (
            <span className="rounded-lg bg-white/15 px-2 py-1 font-mono text-[11px] font-medium text-white backdrop-blur-sm">
              #{property.propertyId}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={cn('flex flex-1 flex-col p-5', bodyClassName)}>
        <h3
          className={cn(
            'truncate text-[16px] font-bold tracking-tight text-slate-900 dark:text-white',
            clickable && 'group-hover:text-indigo-600 dark:group-hover:text-indigo-300',
          )}
        >
          {property.propertyName}
        </h3>

        <div className="mt-3 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 dark:border-slate-800">
          <Meta label="Asset value" value={`$${formatNumber(property.propertyPrice)}`} />
          <Meta label="Size" value={property.propertySize ? `${formatNumber(property.propertySize)} sqft` : '—'} />
          <Meta label="ID" value={`#${property.propertyId}`} mono />
        </div>

        {children && <div className="mt-4 flex-1">{children}</div>}
      </div>
    </Card>
  );
};

const Meta = ({ label, value, mono = false }) => (
  <div className="min-w-0 text-left">
    <p className="text-[10.5px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">{label}</p>
    <p
      className={cn(
        'mt-0.5 truncate text-[13px] font-semibold text-slate-700 tabular-nums dark:text-slate-200',
        mono && 'font-mono text-xs',
      )}
    >
      {value}
    </p>
  </div>
);

export default PropertyCard;
