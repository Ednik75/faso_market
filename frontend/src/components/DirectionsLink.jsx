import { Navigation } from 'lucide-react'
import { directionsLink } from '../utils/geo'

/** Ouvre l'itinéraire Google Maps vers une boutique (nouvel onglet / appli Maps). */
export default function DirectionsLink({ lat, lng, className = '', label = 'Itinéraire' }) {
  if (lat == null || lng == null) return null
  return (
    <a href={directionsLink(lat, lng)} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      className={`relative z-10 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-900 border border-paper-300 bg-white hover:border-ink-900 rounded-full px-3 py-1.5 transition-colors ${className}`}>
      <Navigation className="w-3.5 h-3.5" /> {label}
    </a>
  )
}
