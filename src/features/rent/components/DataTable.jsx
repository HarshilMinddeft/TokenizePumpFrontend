import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Skeleton from '../../../components/ui/Skeleton';
import Tooltip, { InfoTip } from '../../../components/ui/Tooltip';
import { cn } from '../../../lib/utils';

/**
 * DataTable — card-wrapped table with optional header and pagination.
 *
 * A column may carry `info` (shown behind a "?" after its header — how the
 * field is calculated) and `explain(row)` (the worked calculation for that
 * row, shown when hovering the value).
 * @param {Array<{key: string, header: string, align?: 'left'|'right', render?: (row) => React.ReactNode, className?: string, info?: React.ReactNode, explain?: (row) => React.ReactNode}>} columns
 * @param {Array<object>} rows
 * @param {(row) => string} rowKey
 * @param {{page: number, limit: number, total?: number, hasMore?: boolean, onPage: (page) => void}} [pagination]
 */
const DataTable = ({ title, subtitle, action, columns, rows, rowKey, loading = false, empty = 'Nothing here yet.', pagination, className = '' }) => {
  const totalPages = pagination?.total !== undefined ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : null;
  const hasNext = totalPages !== null ? pagination.page < totalPages : pagination?.hasMore;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}

      <div className="tf-scroll overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-5 py-2.5 text-[11px] font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase dark:text-slate-400',
                    col.align === 'right' && 'text-right',
                  )}
                >
                  <span className={cn('inline-flex items-center', col.align === 'right' && 'justify-end')}>
                    {col.header}
                    {col.info && <InfoTip content={col.info} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-5 py-3">
                        <Skeleton className="h-10 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr key={rowKey(row)} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-5 py-3 whitespace-nowrap text-slate-700 tabular-nums dark:text-slate-200',
                          col.align === 'right' && 'text-right',
                          col.className,
                        )}
                      >
                        {col.explain ? (
                          <Tooltip content={col.explain(row)}>
                            <span className="border-b border-dotted border-slate-300 dark:border-slate-600">
                              {col.render ? col.render(row) : row[col.key]}
                            </span>
                          </Tooltip>
                        ) : col.render ? (
                          col.render(row)
                        ) : (
                          row[col.key]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!loading && rows.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">{empty}</p>
      )}

      {pagination && (pagination.page > 1 || hasNext) && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {pagination.page}
            {totalPages !== null && ` of ${totalPages}`}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.page <= 1 || loading}
              onClick={() => pagination.onPage(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={!hasNext || loading} onClick={() => pagination.onPage(pagination.page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DataTable;
