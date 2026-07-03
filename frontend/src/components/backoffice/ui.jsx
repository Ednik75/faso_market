/**
 * Petits composants partagés du back-office (admin + commerçant).
 */

export function KpiCard({ label, value, sub, icon: Icon, loading, tone }) {
  const toneCls = tone === 'danger'
    ? 'bg-red-50 border-red-100 text-red-600'
    : 'bg-stone-50 border-stone-100 text-stone-500'
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-24 bg-stone-100 rounded" />
          <div className="h-8 w-16 bg-stone-100 rounded" />
          <div className="h-3 w-32 bg-stone-100 rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${toneCls}`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-[28px] leading-none font-semibold text-stone-900 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-stone-400 mt-2">{sub}</p>}
        </>
      )}
    </div>
  )
}

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`bg-white border border-stone-200 rounded-xl overflow-hidden ${className}`}>
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100">
        <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

export function StatusBadge({ dot, cls, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md border ${cls}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {label}
    </span>
  )
}

export function TableShell({ headers, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50/70">
            {headers.map(({ label, align = 'left', className = '' }, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-500 text-${align} ${className}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">{children}</tbody>
      </table>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="py-16 text-center">
      <Icon className="w-8 h-8 text-stone-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-stone-600">{title}</p>
      {hint && <p className="text-xs text-stone-400 mt-0.5">{hint}</p>}
    </div>
  )
}

export function ToolbarButton({ onClick, icon: Icon, children, spinning }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-200 hover:border-stone-300 rounded-lg px-3.5 py-2 transition-colors"
    >
      {Icon && <Icon className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />} {children}
    </button>
  )
}

export function PrimaryButton({ onClick, icon: Icon, children, type = 'button', disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
    >
      {Icon && <Icon className="w-4 h-4" />} {children}
    </button>
  )
}

export const STATUS_ORDER_CFG = {
  pending:   { label: 'En attente', dot: 'bg-amber-500',  cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  confirmed: { label: 'Confirmée',  dot: 'bg-blue-500',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  ready:     { label: 'Prête',      dot: 'bg-forest-500', cls: 'bg-forest-50 text-forest-700 border-forest-200' },
  delivered: { label: 'Livrée',     dot: 'bg-stone-400',  cls: 'bg-stone-50 text-stone-600 border-stone-200' },
  cancelled: { label: 'Annulée',    dot: 'bg-red-500',    cls: 'bg-red-50 text-red-700 border-red-200' },
}
