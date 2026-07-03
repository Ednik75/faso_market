import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import ShopCard from '../../components/ShopCard'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/axios'
import { Search, Map, Package, ClipboardList, ArrowRight, Star, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS = {
  pending:   { label: 'En attente',  cls: 'badge-gold' },
  confirmed: { label: 'Confirmée',   cls: 'badge-blue' },
  ready:     { label: 'Prête',       cls: 'badge-green' },
  delivered: { label: 'Livrée',      cls: 'badge-gray' },
  cancelled: { label: 'Annulée',     cls: 'badge-red' },
}

const QUICK_ACTIONS = [
  { to: '/client/catalog', icon: Search,     label: 'Catalogue',   sub: 'Produits & boutiques', color: 'from-forest-500 to-forest-700', bg: 'bg-forest-50',  ic: 'text-forest-600' },
  { to: '/client/map',    icon: Map,         label: 'Carte',       sub: 'Ouagadougou',          color: 'from-forest-500 to-forest-700', bg: 'bg-forest-50',  ic: 'text-forest-600' },
  { to: '/client/cart',   icon: Package,     label: 'Mon panier',  sub: 'Commander maintenant', color: 'from-gold-500 to-gold-600',     bg: 'bg-gold-50',    ic: 'text-gold-600' },
  { to: '/client/orders', icon: ClipboardList,label:'Commandes',  sub: 'Historique & suivi',   color: 'from-gold-500 to-gold-600',    bg: 'bg-gold-50',    ic: 'text-gold-600' },
]

export default function ClientDashboard() {
  const { user } = useAuth()
  const [shops,  setShops]  = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  useEffect(() => {
    Promise.all([api.get('/shops'), api.get('/orders')])
      .then(([s, o]) => { setShops(s.data.slice(0, 4)); setOrders(o.data.slice(0, 3)) })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="page-container">

        {/* ── Welcome banner ── */}
        <div className="relative overflow-hidden rounded-xl3 bg-gradient-hero p-8 mb-8">
          <div className="absolute inset-0 bg-pattern-geo" />
          <div className="absolute right-0 top-0 w-64 h-64 bg-gold-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <p className="text-white/60 text-sm font-display mb-1">🇧🇫 Market BF</p>
            <h1 className="font-display font-black text-3xl text-white mb-2">
              {greeting}, <span className="text-gradient-gold">{user.name.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-white/60 text-sm">Que cherchez-vous aujourd'hui sur le marché burkinabè ?</p>

            {/* Mini search */}
            <Link to="/client/search"
              className="mt-5 flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white/60 text-sm hover:bg-white/15 transition-all max-w-sm group">
              <Search className="w-4 h-4 group-hover:text-gold-400 transition-colors" />
              Rechercher mil, karité, bogolan…
              <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ── Quick actions — Bento ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {QUICK_ACTIONS.map(({ to, icon: Icon, label, sub, color, bg, ic }) => (
            <Link key={to} to={to}
              className="group card-hover flex flex-col gap-4 overflow-hidden relative">
              <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${ic}`} />
              </div>
              <div>
                <p className="font-display font-semibold text-stone-900 text-sm">{label}</p>
                <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
              </div>
              <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-stone-200 group-hover:text-stone-400 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>

        {/* ── Commandes récentes ── */}
        {orders.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xl text-stone-900">Commandes récentes</h2>
              <Link to="/client/orders" className="flex items-center gap-1 text-forest-600 text-sm font-semibold hover:underline">
                Tout voir <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {orders.map(o => {
                const s = STATUS[o.status] || STATUS.pending
                return (
                  <div key={o.id} className="card flex items-center gap-4">
                    <div className="w-10 h-10 bg-sand-100 rounded-xl flex items-center justify-center shrink-0 text-lg">🛍️</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-stone-900 text-sm truncate">{o.shop_name}</p>
                      <p className="text-xs text-stone-400">{o.items?.length || 0} article(s) · {o.total_amount.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                    <span className={`badge ${s.cls}`}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Boutiques ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl text-stone-900">Boutiques disponibles</h2>
            <Link to="/client/map" className="flex items-center gap-1 text-forest-600 text-sm font-semibold hover:underline">
              Voir sur la carte <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="rounded-xl3 h-52 bg-stone-100 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {shops.map(s => <ShopCard key={s.id} shop={s} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
