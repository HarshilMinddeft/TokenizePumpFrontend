import Skeleton from '../../../components/ui/Skeleton';

const PropertyGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        <Skeleton className="aspect-[16/10] rounded-none" />
        <div className="space-y-3 p-5">
          <Skeleton className="h-4 w-2/3" />
          <div className="grid grid-cols-3 gap-2 border-y border-slate-100 py-3 dark:border-slate-800">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    ))}
  </div>
);

export default PropertyGridSkeleton;
