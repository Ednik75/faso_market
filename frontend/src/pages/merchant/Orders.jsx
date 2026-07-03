import { useState, useEffect, useMemo } from 'react'
import MerchantLayout from '../../components/merchant/MerchantLayout'
import { StatusBadge, EmptyState, ToolbarButton, STATUS_ORDER_CFG } from '../../components/backoffice/ui'
import api from '../../api/axios'
import { ChevronDown, ChevronUp, RefreshCw, ClipboardList, Banknote, MapPin, Navigation } from 'lucide-react'
import { mapsLink } from '../../utils/geo'
import toast from 'react-hot-toast'

const STATUSES = ['pending', 'confirmed', 'ready', 'delivered', 'cancelled']

const PAYMENT_LOGO = {
  orange_money: '/orange.png',
  moov_money:   '/moov.png',
  wave:         '/wave.png',
}
const PAYMENT_LABEL = {
  orange_money:     'Orange Money',
  moov_money:       'Moov Money',
  wave:             'Wave',
  cash_on_delivery: 'Paiement à la livraison',
}

export default function MerchantOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [updating, setUpdating] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/orders')
      .then(({ data }) => setOrders(data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const counts = useMemo(() => {
    const c = { '': orders.length }
    for (const s of STATUSES) c[s] = orders.filter(o => o.status === s).length
    return c
  }, [orders])

  const filtered = filter ? orders.filter(o => o.status === filter) : orders

  const updateStatus = async (orderId, status) => {
    if (status === 'cancelled' && !confirm('Annuler cette commande ?\nLe stock des produits sera automatiquement restitué.')) return
    setUpdating(orderId)
    try {
      await api.put(`/orders/${orderId}/status`, { status })
      toast.success(status === 'delivered'
        ? 'Commande livrée — un email de confirmation a été envoyé au client'
        : 'Statut mis à jour')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally { setUpdating(null) }
  }

  const TABS = [{ value: '', label: 'Toutes' }, ...STATUSES.map(s => ({ value: s, label: STATUS_ORDER_CFG[s].label }))]

  return (
    <MerchantLayout
      subtitle="Suivez et traitez les commandes de vos clients"
      actions={<ToolbarButton onClick={load} icon={RefreshCw} spinning={loading}>Actualiser</ToolbarButton>}
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
                {counts[value] ?? 0}
              </span>
              {active && <span className="absolute bottom-0 inset-x-3 h-0.5 bg-stone-900 rounded-full" />}
            </button>
          )
        })}
      </div>

      {/* Liste */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-stone-50 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Aucune commande dans cette catégorie" hint="Les commandes de vos clients apparaîtront ici." />
        ) : (
          <ul className="divide-y divide-stone-100">
            {filtered.map(order => {
              const s = STATUS_ORDER_CFG[order.status] || STATUS_ORDER_CFG.pending
              const isOpen = expanded === order.id
              return (
                <li key={order.id}>
                  <button
                    className={`flex items-center gap-4 w-full text-left px-5 py-3.5 transition-colors ${isOpen ? 'bg-stone-50/70' : 'hover:bg-stone-50/60'}`}
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                  >
                    <div className="w-9 h-9 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-stone-500">#{order.id}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {order.client_name}
                        {order.client_phone && <span className="font-normal text-stone-400 ml-2 text-xs">{order.client_phone}</span>}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                        })}
                        {' · '}{order.items?.length ?? 0} article{(order.items?.length ?? 0) > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-stone-900 tabular-nums shrink-0 hidden sm:block">
                      {order.total_amount.toLocaleString('fr-FR')} F
                    </span>
                    <StatusBadge {...s} />
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                    }
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 bg-stone-50/70 border-t border-stone-100">

                      {/* Articles */}
                      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden mb-3">
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-stone-100">
                            {order.items?.map(item => (
                              <tr key={item.id}>
                                <td className="px-4 py-2.5 text-stone-700">
                                  <span className="font-medium">{item.product_name}</span>
                                  <span className="text-stone-400"> × {item.quantity}</span>
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold text-stone-800 tabular-nums">
                                  {(item.unit_price * item.quantity).toLocaleString('fr-FR')} F
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-stone-50/70">
                              <td className="px-4 py-2.5 font-semibold text-stone-900">Total</td>
                              <td className="px-4 py-2.5 text-right font-bold text-forest-700 tabular-nums">
                                {order.total_amount.toLocaleString('fr-FR')} FCFA
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Paiement + statut */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-stone-200 rounded-lg px-4 py-3">
                        <span className="flex items-center gap-2 text-sm text-stone-600">
                          {PAYMENT_LOGO[order.payment_method]
                            ? <img src={PAYMENT_LOGO[order.payment_method]} alt="" className="h-4 w-auto object-contain" />
                            : <Banknote className="w-4 h-4 text-stone-400" />
                          }
                          {PAYMENT_LABEL[order.payment_method] || order.payment_method}
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-stone-500 font-medium">Statut :</label>
                          <select
                            value={order.status}
                            onChange={e => updateStatus(order.id, e.target.value)}
                            disabled={updating === order.id || order.status === 'delivered'}
                            className="bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {STATUSES.map(st => (
                              <option key={st} value={st}>{STATUS_ORDER_CFG[st].label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Livraison */}
                      {(order.delivery_address || (order.delivery_latitude != null && order.delivery_longitude != null)) && (
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-stone-200 rounded-lg px-4 py-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <MapPin className="w-4 h-4 text-forest-600 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-0.5">Livraison</p>
                              {order.delivery_address && (
                                <p className="text-sm font-medium text-stone-800">{order.delivery_address}</p>
                              )}
                              {order.delivery_latitude != null && order.delivery_longitude != null && (
                                <p className="text-xs text-stone-400 tabular-nums mt-0.5">
                                  Position GPS partagée par le client · {Number(order.delivery_latitude).toFixed(5)}, {Number(order.delivery_longitude).toFixed(5)}
                                </p>
                              )}
                            </div>
                          </div>
                          {order.delivery_latitude != null && order.delivery_longitude != null && (
                            <a
                              href={mapsLink(order.delivery_latitude, order.delivery_longitude)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg px-3 py-2 transition-colors shrink-0"
                            >
                              <Navigation className="w-3.5 h-3.5" /> Itinéraire (Google Maps)
                            </a>
                          )}
                        </div>
                      )}

                      {order.notes && (
                        <div className="mt-3 bg-amber-50/70 border border-amber-100 rounded-lg px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-1">Instructions du client</p>
                          <p className="text-sm text-stone-700 whitespace-pre-line">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </MerchantLayout>
  )
}
