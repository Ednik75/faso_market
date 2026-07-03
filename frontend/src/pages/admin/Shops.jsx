import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../api/axios'
import { Check, X, Store, RefreshCw, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CFG = {
  pending:  { label: 'En attente', dot: 'bg-amber-500',  cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  active:   { label: 'Active',     dot: 'bg-forest-500', cls: 'bg-forest-50 text-forest-700 border-forest-200' },
  rejected: { label: 'Rejetée',    dot: 'bg-red-500',    cls: 'bg-red-50 text-red-700 border-red-200' },
}

const TABS = [
  { value: 'pending',  label: 'En attente' },
  { value: 'active',   label: 'Actives' },
  { value: 'rejected', label: 'Rejetées' },
  { value: '',         label: 'Toutes' },
]

export default function AdminShops() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [processing, setProcessing] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/admin/shops')
      .then(({ data }) => setShops(data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const counts = useMemo(() => ({
    pending:  shops.filter(s => s.status === 'pending').length,
    active:   shops.filter(s => s.status === 'active').length,
    rejected: shops.filter(s => s.status === 'rejected').length,
    '':       shops.length,
  }), [shops])

  const filtered = filter ? shops.filter(s => s.status === filter) : shops

  const validate = async (shop, status) => {
    if (status === 'rejected') {
      const verb = shop.status === 'active' ? 'désactiver' : 'rejeter'
      if (!confirm(`Voulez-vous vraiment ${verb} la boutique « ${shop.name} » ?\nElle ne sera plus visible par les clients.`)) return
    }
    setProcessing(shop.id)
    try {
      await api.put(`/admin/shops/${shop.id}/validate`, { status })
      toast.success(status === 'active' ? 'Boutique activée' : 'Boutique désactivée')
      setShops(prev => prev.map(s => s.id === shop.id ? { ...s, status } : s))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally { setProcessing(null) }
  }

  return (
    <AdminLayout
      subtitle="Validez les demandes d'ouverture et contrôlez les boutiques de la plateforme"
      actions={
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-200 hover:border-stone-300 rounded-lg px-3.5 py-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      }
    >

      {/* Onglets avec compteurs */}
      <div className="flex gap-1 border-b border-stone-200 mb-5 overflow-x-auto">
        {TABS.map(({ value, label }) => {
          const active = filter === value
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                active ? 'font-semibold text-stone-900' : 'font-medium text-stone-500 hover:text-stone-800'
              }`}
            >
              {label}
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded tabular-nums ${
                active ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
              }`}>
                {counts[value]}
              </span>
              {active && <span className="absolute bottom-0 inset-x-3 h-0.5 bg-stone-900 rounded-full" />}
            </button>
          )
        })}
      </div>

      {/* Tableau */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-stone-50 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Store className="w-8 h-8 text-stone-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-stone-600">Aucune boutique dans cette catégorie</p>
            <p className="text-xs text-stone-400 mt-0.5">Les nouvelles demandes apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70">
                  {['Boutique', 'Propriétaire', 'Localisation', 'Produits', 'Créée le', 'Statut', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-500 ${h === 'Actions' ? 'text-right' : 'text-left'} ${h === 'Produits' ? 'text-center' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map(shop => {
                  const cfg = STATUS_CFG[shop.status] || STATUS_CFG.pending
                  const busy = processing === shop.id
                  return (
                    <tr key={shop.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-stone-900">{shop.name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{shop.category}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-stone-700">{shop.owner_name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{shop.owner_email}{shop.owner_phone ? ` · ${shop.owner_phone}` : ''}</p>
                      </td>
                      <td className="px-4 py-3.5 text-stone-500 max-w-[220px]">
                        {shop.address ? (
                          <span className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                            <span className="truncate">{shop.address}</span>
                          </span>
                        ) : <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center text-stone-700 tabular-nums">{shop.product_count}</td>
                      <td className="px-4 py-3.5 text-stone-500 tabular-nums whitespace-nowrap">
                        {new Date(shop.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md border ${cfg.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {shop.status !== 'active' && (
                            <button
                              onClick={() => validate(shop, 'active')}
                              disabled={busy}
                              className="flex items-center gap-1 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" /> {shop.status === 'rejected' ? 'Réactiver' : 'Valider'}
                            </button>
                          )}
                          {shop.status !== 'rejected' && (
                            <button
                              onClick={() => validate(shop, 'rejected')}
                              disabled={busy}
                              className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> {shop.status === 'active' ? 'Désactiver' : 'Rejeter'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
