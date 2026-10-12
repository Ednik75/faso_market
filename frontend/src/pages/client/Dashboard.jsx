import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import ShopCard from '../../components/ShopCard'
import ShopsMapView from '../../components/ShopsMapView'
import CategoryIcon from '../../components/CategoryIcon'
import { PositionChip, RadiusFilter } from '../../components/LocationBar'
import { useAuth } from '../../contexts/AuthContext'
import { usePosition } from '../../contexts/PositionContext'
import { sortByDistance, RADIUS_OPTIONS } from '../../utils/geo'
import api from '../../api/axios'
import {
  Search, ArrowRight, ShoppingBag, List, Map as MapIcon, LocateFixed, Store, Navigation,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS = {
  pending:   { label: 'En attente',  cls: 'badge-accent' },
  confirmed: { label: 'Confirmée',   cls: 'badge-blue' },
  ready:     { label: 'Prête',       cls: 'badge-green' },
  delivered: { label: 'Livrée',      cls: 'badge-gray' },
  cancelled: { label: 'Annulée',     cls: 'badge-red' },
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const { position, radius, setRadius, openPicker, alreadyAsked } = usePosition()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const view = params.get('vue') === 'carte' ? 'map' : 'list'

  const [shops,  setShops]  = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/shops'), api.get('/orders')])
      .then(([s, o]) => { setShops(s.data); setOrders(o.data.slice(0, 3)) })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  // Première visite : on demande la position une seule fois
  useEffect(() => {
    if (!position && !alreadyAsked()) openPicker()
  }, [])

  const categories = useMemo(() => [...new Set(shops.map(s => s.category).filter(Boolean))], [shops])

  const nearby = useMemo(() => {
    const filtered = shops.filter(s => !category || s.category === category)
    return sortByDistance(filtered, position, position ? radius : null)
  }, [shops, category, position, radius])

  // Rayon le plus petit qui contient au moins une boutique (suggestion quand la liste est vide)
  const widerRadius = useMemo(() => {
    if (!position || nearby.length) return null
    const all = sortByDistance(shops.filter(s => !category || s.category === category), position)
    return RADIUS_OPTIONS.find(r => r != null && r > (radius ?? 0) && all.some(s => s.distance != null && s.distance <= r)) ?? null
  }, [nearby.length, shops, category, position, radius])

  const setView = (v) => setParams(v === 'map' ? { vue: 'carte' } : {}, { replace: true })
  const submitSearch = (e) => {
    e.preventDefault()
    navigate(query.trim() ? `/client/catalog?q=${encodeURIComponent(query.trim())}` : '/client/catalog')
  }

  const first = user.name.split(' ')[0]

  return (
    <div className="min-h-screen bg-paper-50">
      <Navbar />
      <div className="page-container">

        {/* ── En-tête ── */}
        <header className="mb-8">
          <p className="eyebrow mb-3"><Navigation className="w-3.5 h-3.5" /> Près de moi</p>
          <h1 className="page-title">
            {position
              ? <>Boutiques autour de <em className="text-brand-600 font-normal">{position.source === 'gps' ? 'vous' : position.label}</em></>
              : <>Bonjour {first}, où êtes-vous ?</>}
          </h1>

          <form onSubmit={submitSearch} className="relative mt-6 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input className="input pl-11 pr-32 py-3.5 rounded-full" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Mil, karité, pagne…" aria-label="Rechercher un produit" />
            <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-sm bg-ink-900 text-white hover:bg-brand-600">
              Chercher <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </header>

        {/* ── Pas encore de position ── */}
        {!position && (
          <div className="card-muted flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <span className="w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0">
              <LocateFixed className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-ink-900">Indiquez votre position pour voir les boutiques les plus proches</p>
              <p className="text-sm text-stone-500 mt-0.5">GPS en un clic, ou choisissez simplement votre quartier.</p>
            </div>
            <button onClick={openPicker} className="btn-primary">Définir ma position</button>
          </div>
        )}

        {/* ── Barre d'outils ── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <PositionChip />
          <RadiusFilter />
          <div className="ml-auto inline-flex p-1 bg-paper-100 border border-paper-200 rounded-full" role="tablist" aria-label="Affichage">
            {[{ v: 'list', label: 'Liste', icon: List }, { v: 'map', label: 'Carte', icon: MapIcon }].map(({ v, label, icon: Icon }) => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  view === v ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-paper-200'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Catégories */}
        {categories.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            {['', ...categories].map(c => (
              <button key={c || 'all'} onClick={() => setCategory(c)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border shrink-0 transition-colors ${
                  category === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-ink-700 border-paper-300 hover:border-ink-900'
                }`}>
                {c ? <CategoryIcon category={c} className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                {c || 'Toutes'}
              </button>
            ))}
          </div>
        )}

        {/* Compteur */}
        {!loading && (
          <p className="text-sm text-stone-500 mb-4">
            <span className="font-semibold text-ink-900">{nearby.length}</span> boutique{nearby.length > 1 ? 's' : ''}
            {position ? (radius ? ` à moins de ${radius} km` : ' · triées par distance') : ' au Burkina Faso'}
          </p>
        )}

        {/* ── Résultats ── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="rounded-xl3 h-52 bg-paper-100 animate-pulse" />)}
          </div>
        ) : nearby.length === 0 ? (
          <div className="card text-center py-14">
            <span className="w-12 h-12 rounded-2xl bg-paper-100 text-paper-500 flex items-center justify-center mx-auto mb-4">
              <Store className="w-5 h-5" />
            </span>
            <p className="font-semibold text-ink-900">Aucune boutique {radius ? `à moins de ${radius} km` : 'trouvée'}</p>
            <p className="text-sm text-stone-500 mt-1">Élargissez la zone de recherche ou changez de catégorie.</p>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {widerRadius && (
                <button onClick={() => setRadius(widerRadius)} className="btn-primary">Élargir à {widerRadius} km</button>
              )}
              <button onClick={() => setRadius(null)} className="btn-outline">Tout le Burkina</button>
            </div>
          </div>
        ) : view === 'map' ? (
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
            <ShopsMapView shops={nearby} position={position} radius={radius} selected={selected} onSelect={setSelected} />
            <div className="space-y-3 lg:max-h-[520px] lg:overflow-y-auto scroll-thin lg:pr-1">
              {nearby.map(s => (
                <ShopCard key={s.id} shop={s} active={selected?.id === s.id} onHover={() => setSelected(s)} />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearby.map(s => <ShopCard key={s.id} shop={s} />)}
          </div>
        )}

        {/* ── Commandes récentes ── */}
        {orders.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-medium text-xl text-ink-900">Vos commandes récentes</h2>
              <Link to="/client/orders" className="flex items-center gap-1 text-brand-600 text-sm font-semibold hover:underline">
                Tout voir <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {orders.map(o => {
                const s = STATUS[o.status] || STATUS.pending
                return (
                  <Link key={o.id} to="/client/orders" className="card !p-4 flex items-center gap-3 hover:shadow-soft-md">
                    <span className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-[18px] h-[18px]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink-900 text-sm truncate">{o.shop_name}</p>
                      <p className="text-xs text-stone-500">{o.total_amount.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                    <span className={`badge ${s.cls}`}>{s.label}</span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
