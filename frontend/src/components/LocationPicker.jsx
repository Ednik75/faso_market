import { useEffect } from 'react'
import { LocateFixed, Loader2, MapPin, X, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePosition } from '../contexts/PositionContext'
import { ZONES } from '../utils/geo'

/**
 * Fenêtre « Où êtes-vous ? » : GPS en un clic, ou choix d'un quartier / d'une ville
 * quand la géolocalisation est refusée ou imprécise.
 */
export default function LocationPicker() {
  const { pickerOpen, closePicker, locate, locating, chooseZone, position } = usePosition()

  useEffect(() => {
    if (!pickerOpen) return
    const onKey = (e) => { if (e.key === 'Escape') closePicker() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pickerOpen, closePicker])

  if (!pickerOpen) return null

  const useGps = async () => {
    try {
      await locate()
      toast.success('Position trouvée. Les boutiques sont triées par proximité.', {
        icon: <LocateFixed className="w-4 h-4 text-brand-600" />,
      })
      closePicker()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const pick = (zone) => { chooseZone(zone); closePicker() }
  const groups = [...new Set(ZONES.map(z => z.group))]

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="loc-title">
      <div className="absolute inset-0 bg-ink-950/50 animate-fade-in" onClick={closePicker} />
      <div className="relative w-full sm:max-w-lg bg-paper-50 rounded-t-xl4 sm:rounded-xl4 shadow-soft-lg max-h-[90vh] overflow-y-auto animate-fade-up">
        <div className="p-6 sm:p-8">
          <button onClick={closePicker} aria-label="Fermer"
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-stone-500 hover:bg-paper-200 transition-colors">
            <X className="w-5 h-5" />
          </button>

          <span className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mb-5">
            <MapPin className="w-6 h-6" />
          </span>
          <h2 id="loc-title" className="font-display font-medium text-2xl text-ink-900">Où êtes-vous ?</h2>
          <p className="text-stone-500 text-sm mt-1.5 leading-relaxed">
            Nous affichons d'abord les boutiques les plus proches de vous, avec la distance et l'itinéraire.
          </p>

          <button onClick={useGps} disabled={locating} className="btn-primary btn-lg w-full mt-6">
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
            {locating ? 'Localisation…' : 'Utiliser ma position actuelle'}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 mt-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Votre position reste sur votre téléphone.
          </p>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 border-t border-paper-200" />
            <span className="text-xs text-stone-400 font-medium">ou choisissez votre quartier</span>
            <div className="flex-1 border-t border-paper-200" />
          </div>

          {groups.map(group => (
            <div key={group} className="mb-5 last:mb-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400 mb-2.5">{group}</p>
              <div className="flex flex-wrap gap-2">
                {ZONES.filter(z => z.group === group).map(z => {
                  const active = position?.source === 'zone' && position.label === z.label
                  return (
                    <button key={z.label} onClick={() => pick(z)}
                      className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
                        active
                          ? 'bg-ink-900 text-white border-ink-900'
                          : 'bg-white text-ink-700 border-paper-300 hover:border-ink-900'
                      }`}>
                      {z.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
