/**
 * Petits composants partagés du back-office (admin + commerçant).
 */

export function KpiCard({ label, value, sub, icon: Icon, loading, tone }) {
  const toneCls = tone === 'danger'
    ? 'bg-danger-50 border-danger-100 text-danger-600'
    : 'bg-brand-50 border-brand-100 text-brand-600'
  return (
    <div className="bg-white border border-paper-200 rounded-2xl p-5 shadow-soft">
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
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${toneCls}`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-[32px] leading-none font-medium text-stone-900 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-stone-400 mt-2">{sub}</p>}
        </>
      )}
    </div>
  )
}

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`bg-white border border-paper-200 rounded-2xl overflow-hidden shadow-soft ${className}`}>
      <header className="flex items-center justify-between px-5 py-4 border-b border-paper-200">
        <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

export function StatusBadge({ dot, cls, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full border ${cls}`}>
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
          <tr className="border-b border-paper-200 bg-paper-50">
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
        <tbody className="divide-y divide-paper-100">{children}</tbody>
      </table>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="py-16 text-center">
      <span className="w-12 h-12 rounded-2xl bg-paper-100 text-paper-500 flex items-center justify-center mx-auto mb-3"><Icon className="w-5 h-5" /></span>
      <p className="text-sm font-medium text-stone-600">{title}</p>
      {hint && <p className="text-xs text-stone-400 mt-0.5">{hint}</p>}
    </div>
  )
}

export function ToolbarButton({ onClick, icon: Icon, children, spinning }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 bg-white border border-paper-300 hover:border-ink-900 rounded-full px-4 py-2 transition-colors"
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
      className="flex items-center gap-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-full px-4 py-2 transition-colors disabled:opacity-50"
    >
      {Icon && <Icon className="w-4 h-4" />} {children}
    </button>
  )
}

export const STATUS_ORDER_CFG = {
  pending:   { label: 'En attente', dot: 'bg-amber-500',  cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  confirmed: { label: 'Confirmée',  dot: 'bg-blue-500',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  ready:     { label: 'Prête',      dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  delivered: { label: 'Livrée',     dot: 'bg-stone-400',  cls: 'bg-stone-50 text-stone-600 border-stone-200' },
  cancelled: { label: 'Annulée',    dot: 'bg-red-500',    cls: 'bg-red-50 text-red-700 border-red-200' },
}
