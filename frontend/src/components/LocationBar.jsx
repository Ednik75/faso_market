import { MapPin, LocateFixed, ChevronDown } from 'lucide-react'
import { usePosition } from '../contexts/PositionContext'
import { RADIUS_OPTIONS } from '../utils/geo'

/** Bouton compact affichant la position courante ; ouvre le sélecteur. */
export function PositionChip({ className = '' }) {
  const { position, openPicker } = usePosition()
  const Icon = position?.source === 'gps' ? LocateFixed : MapPin
  return (
    <button onClick={openPicker}
      className={`inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border text-sm font-medium transition-colors max-w-[220px] ${
        position
          ? 'bg-white border-paper-300 text-ink-900 hover:border-ink-900'
          : 'bg-brand-600 border-brand-600 text-white hover:bg-brand-700'
      } ${className}`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${position ? 'bg-brand-50 text-brand-600' : 'bg-white/15'}`}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="truncate">{position ? position.label : 'Définir ma position'}</span>
      <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
    </button>
  )
}

/** Choix du rayon de recherche autour de la position. */
export function RadiusFilter({ className = '' }) {
  const { radius, setRadius, position } = usePosition()
  return (
    <div className={`inline-flex items-center p-1 bg-paper-100 border border-paper-200 rounded-full ${className}`}
      role="radiogroup" aria-label="Rayon de recherche">
      {RADIUS_OPTIONS.map(r => {
        const active = radius === r
        return (
          <button key={String(r)} role="radio" aria-checked={active} disabled={!position}
            onClick={() => setRadius(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-40 ${
              active ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-paper-200'
            }`}>
            {r == null ? 'Tout' : `${r} km`}
          </button>
        )
      })}
    </div>
  )
}
