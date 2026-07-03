import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import MerchantLayout from '../../components/merchant/MerchantLayout'
import { KpiCard, Panel, StatusBadge, EmptyState, STATUS_ORDER_CFG } from '../../components/backoffice/ui'
import api from '../../api/axios'
import {
  TrendingUp, Package, AlertTriangle, ClipboardList,
  Plus, ArrowUpRight, Store, CheckCircle2, Clock,
} from 'lucide-react'

const SHOP_STATUS = {
  active:   { label: 'Boutique active', dot: 'bg-forest-500', cls: 'bg-forest-50 text-forest-700 border-forest-200' },
  pending:  { label: 'En attente de validation', dot: 'bg-amber-500', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  rejected: { label: 'Boutique rejetée', dot: 'bg-red-500', cls: 'bg-red-50 text-red-700 border-red-200' },
}

export default function MerchantDashboard() {
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [orders, setOrders] = useState([])
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/stats/overview').catch(() => ({ data: null })),
      api.get('/stock/alerts').catch(() => ({ data: [] })),
      api.get('/orders').catch(() => ({ data: [] })),
      api.get('/shops/merchant/mine').catch(() => ({ data: null })),
    ]).then(([sv, al, or, sh]) => {
      setStats(sv.data); setAlerts(al.data); setOrders(or.data.slice(0, 6)); setShop(sh.data)
    }).finally(() => setLoading(false))
  }, [])

  const kpis = [
    { label: 'Revenus totaux', value: stats ? `${(stats.total_revenue ?? 0).toLocaleString('fr-FR')} F` : '—', sub: 'Hors commandes annulées', icon: TrendingUp },
    { label: 'Commandes', value: stats?.total_orders ?? '—', sub: `${stats?.pending_orders ?? 0} à traiter`, icon: ClipboardList },
    { label: 'Produits', value: stats?.product_count ?? '—', sub: 'Dans votre catalogue', icon: Package },
    { label: 'Alertes stock', value: stats?.low_stock_count ?? '—', sub: 'Produits sous le seuil', icon: AlertTriangle, tone: (stats?.low_stock_count ?? 0) > 0 ? 'danger' : undefined },
  ]

  const shopStatus = shop ? SHOP_STATUS[shop.status] : null

  return (
    <MerchantLayout
      subtitle={shop ? `${shop.name} — vue d'ensemble de votre activité` : 'Vue d\'ensemble de votre activité'}
      actions={
        !loading && !shop ? (
          <Link to="/merchant/profile" className="flex items-center gap-2 text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg px-4 py-2 transition-colors">
            <Plus className="w-4 h-4" /> Créer ma boutique
          </Link>
        ) : shopStatus && <StatusBadge {...shopStatus} />
      }
    >

      {/* Pas encore de boutique */}
      {!loading && !shop && (
        <div className="bg-white border border-stone-200 rounded-xl py-16 text-center mb-6">
          <Store className="w-8 h-8 text-stone-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-600 mb-1">Vous n'avez pas encore de boutique</p>
          <p className="text-xs text-stone-400 mb-5">Créez votre boutique pour commencer à vendre sur Market BF.</p>
          <Link to="/merchant/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg px-4 py-2 transition-colors">
            <Plus className="w-4 h-4" /> Créer ma boutique
          </Link>
        </div>
      )}

      {/* Bandeau commandes à traiter */}
      {!loading && stats?.pending_orders > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-900 flex-1">
            <strong>{stats.pending_orders} commande{stats.pending_orders > 1 ? 's' : ''}</strong> en attente de traitement.
          </p>
          <Link to="/merchant/orders" className="text-sm font-semibold text-blue-800 hover:text-blue-900 flex items-center gap-1 shrink-0">
            Traiter <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => <KpiCard key={k.label} {...k} loading={loading} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Commandes récentes */}
        <Panel
          className="xl:col-span-2"
          title="Commandes récentes"
          action={
            <Link to="/merchant/orders" className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1">
              Tout voir <ArrowUpRight className="w-3 h-3" />
            </Link>
          }
        >
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-stone-50 rounded-lg animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Aucune commande pour l'instant" hint="Les commandes de vos clients apparaîtront ici." />
          ) : (
            <ul className="divide-y divide-stone-100">
              {orders.map(o => {
                const s = STATUS_ORDER_CFG[o.status] || STATUS_ORDER_CFG.pending
                return (
                  <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-9 h-9 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-stone-500">#{o.id}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">{o.client_name}</p>
                      <p className="text-xs text-stone-400">
                        {new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-stone-900 tabular-nums shrink-0">
                      {o.total_amount?.toLocaleString('fr-FR')} F
                    </span>
                    <StatusBadge {...s} />
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        {/* Alertes stock */}
        <Panel
          title="Alertes de stock"
          action={
            <Link to="/merchant/stock" className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1">
              Gérer <ArrowUpRight className="w-3 h-3" />
            </Link>
          }
        >
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2].map(i => <div key={i} className="h-12 bg-stone-50 rounded-lg animate-pulse" />)}
            </div>
          ) : alerts.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-forest-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-600">Stock sous contrôle</p>
              <p className="text-xs text-stone-400 mt-0.5">Aucun produit sous son seuil d'alerte.</p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {alerts.map(a => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{a.name}</p>
                    <p className="text-xs text-stone-400">Seuil : {a.low_stock_threshold}</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-md border bg-red-50 text-red-700 border-red-200 tabular-nums shrink-0">
                    {a.quantity} restant{a.quantity > 1 ? 's' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </MerchantLayout>
  )
}
