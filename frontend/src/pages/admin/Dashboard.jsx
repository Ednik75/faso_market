import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { KpiCard, Panel } from '../../components/backoffice/ui'
import api from '../../api/axios'
import {
  Users, Store, ShoppingBag, Package, Clock,
  ArrowUpRight, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_BADGE = {
  admin:    'bg-stone-100 text-stone-700 border-stone-200',
  merchant: 'bg-blue-50 text-blue-700 border-blue-100',
  client:   'bg-forest-50 text-forest-700 border-forest-100',
}
const ROLE_LABEL = { admin: 'Admin', merchant: 'Commerçant', client: 'Client' }

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [pendingShops, setPendingShops] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/shops', { params: { status: 'pending' } }),
      api.get('/admin/users'),
    ])
      .then(([s, sh, u]) => {
        setStats(s.data)
        setPendingShops(sh.data)
        setRecentUsers(u.data.slice(0, 6))
      })
      .catch(() => toast.error('Erreur de chargement des données'))
      .finally(() => setLoading(false))
  }, [])

  const kpis = [
    { label: 'Utilisateurs', value: stats?.total_users ?? '—', sub: `${stats?.merchants ?? 0} commerçants · ${stats?.clients ?? 0} clients`, icon: Users },
    { label: 'Boutiques actives', value: stats?.active_shops ?? '—', sub: `${stats?.pending_shops ?? 0} en attente de validation`, icon: Store },
    { label: 'Commandes', value: stats?.total_orders ?? '—', sub: `${(stats?.total_revenue ?? 0).toLocaleString('fr-FR')} FCFA de volume`, icon: ShoppingBag },
    { label: 'Produits publiés', value: stats?.total_products ?? '—', sub: 'Toutes boutiques confondues', icon: Package },
  ]

  return (
    <AdminLayout subtitle="Vue d'ensemble de la plateforme Market BF">

      {/* Bandeau d'action requise */}
      {!loading && stats?.pending_shops > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-900 flex-1">
            <strong>{stats.pending_shops} boutique{stats.pending_shops > 1 ? 's' : ''}</strong> en attente de validation.
          </p>
          <Link to="/admin/shops" className="text-sm font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 shrink-0">
            Traiter <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => <KpiCard key={k.label} {...k} loading={loading} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Boutiques en attente */}
        <Panel
          title="Boutiques en attente de validation"
          action={
            <Link to="/admin/shops" className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1">
              Tout voir <ArrowUpRight className="w-3 h-3" />
            </Link>
          }
        >
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2].map(i => <div key={i} className="h-12 bg-stone-50 rounded-lg animate-pulse" />)}
            </div>
          ) : pendingShops.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-forest-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-600">Aucune validation en attente</p>
              <p className="text-xs text-stone-400 mt-0.5">Toutes les demandes ont été traitées.</p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {pendingShops.map(shop => (
                <li key={shop.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{shop.name}</p>
                    <p className="text-xs text-stone-400 truncate">
                      {shop.owner_name} · {shop.category} · {new Date(shop.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Link
                    to="/admin/shops"
                    className="text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-300 rounded-lg px-3 py-1.5 transition-colors shrink-0"
                  >
                    Examiner
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Derniers inscrits */}
        <Panel
          title="Derniers utilisateurs inscrits"
          action={
            <Link to="/admin/users" className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1">
              Tout voir <ArrowUpRight className="w-3 h-3" />
            </Link>
          }
        >
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-stone-50 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {recentUsers.map(u => (
                <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-stone-600">{u.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{u.name}</p>
                    <p className="text-xs text-stone-400 truncate">{u.email}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${ROLE_BADGE[u.role] || ROLE_BADGE.client} shrink-0`}>
                    {ROLE_LABEL[u.role] || u.role}
                  </span>
                  <span className="text-xs text-stone-400 tabular-nums shrink-0 hidden sm:block w-20 text-right">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AdminLayout>
  )
}
