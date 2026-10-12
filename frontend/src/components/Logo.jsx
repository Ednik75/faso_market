import { Link } from 'react-router-dom'

/**
 * Logotype Market BF : monogramme (étoile du drapeau dans un sceau) + nom.
 * `tone="light"` pour les fonds sombres.
 */
export function LogoMark({ className = 'w-9 h-9' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#b8461f" />
      <path d="M8 29h24" stroke="#f2b630" strokeWidth="2.5" strokeLinecap="round" />
      <path
        fill="#fff"
        d="M20 8.5l2.47 5.9 6.37.52-4.85 4.16 1.48 6.22L20 22l-5.47 3.3 1.48-6.22-4.85-4.16 6.37-.52z"
      />
    </svg>
  )
}

export default function Logo({ to = '/', tone = 'dark', sub = 'Burkina Faso', className = '' }) {
  const main = tone === 'light' ? 'text-white' : 'text-ink-900'
  const muted = tone === 'light' ? 'text-white/45' : 'text-paper-600'
  return (
    <Link to={to} className={`flex items-center gap-2.5 w-fit group ${className}`}>
      <LogoMark className="w-9 h-9 transition-transform group-hover:-rotate-6" />
      <span className="leading-none">
        <span className={`block font-display text-[21px] font-semibold tracking-tight ${main}`}>
          Market<span className="text-brand-500">BF</span>
        </span>
        {sub && (
          <span className={`block text-[9.5px] font-semibold uppercase tracking-[0.22em] mt-1 ${muted}`}>{sub}</span>
        )}
      </span>
    </Link>
  )
}
