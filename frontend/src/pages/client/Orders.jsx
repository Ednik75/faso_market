import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { ClipboardList, ChevronDown, ChevronUp, ShoppingBag, MapPin, LocateFixed } from 'lucide-react'
import { mapsLink } from '../../utils/geo'
import toast from 'react-hot-toast'

const STATUS = {
  pending:   { label: 'En attente',     cls: 'badge-gold' },
  confirmed: { label: 'Confirmée',      cls: 'badge-blue' },
  ready:     { label: 'Prête à retirer',cls: 'badge-green' },
  delivered: { label: 'Livrée',         cls: 'badge-gray' },
  cancelled: { label: 'Annulée',        cls: 'badge-red' },
}
const PAYMENT_LOGO = {
  orange_money:    '/orange.png',
  moov_money:      '/moov.png',
  wave:            '/wave.png',
}
const PAYMENT_LABEL = {
  orange_money:    'Orange Money',
  moov_money:      'Moov Money',
  wave:            'Wave',
  cash_on_delivery:'Cash à la livraison',
}

export default function ClientOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => setOrders(data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="page-container max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-stone-400 text-sm font-display mb-1">📦 Suivi</p>
          <h1 className="font-display font-black text-3xl text-stone-900">Mes commandes</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse bg-stone-50" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="card text-center py-20">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-stone-300" />
            </div>
            <p className="font-display font-bold text-stone-500 text-lg mb-1">Aucune commande</p>
            <p className="text-stone-400 text-sm">Vos commandes apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const s = STATUS[order.status] || STATUS.pending
              const isOpen = expanded === order.id
              return (
                <div key={order.id} className={`card transition-all ${isOpen ? 'shadow-glass-md' : ''}`}>
                  <button
                    className="flex items-center justify-between w-full text-left"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-sand-100 rounded-xl flex items-center justify-center shrink-0 text-lg">
                        🛍️
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-stone-900 truncate">{order.shop_name}</p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {' · '}
                          <span className="font-semibold text-stone-600">{order.total_amount.toLocaleString('fr-FR')} FCFA</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className={`badge ${s.cls}`}>{s.label}</span>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-stone-400" />
                        : <ChevronDown className="w-4 h-4 text-stone-400" />
                      }
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-stone-100 animate-fade-up">
                      <div className="space-y-2 mb-4">
                        {order.items?.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="text-stone-700">
                              <span className="font-medium">{item.product_name}</span>
                              <span className="text-stone-400"> × {item.quantity}</span>
                            </span>
                            <span className="font-semibold text-stone-800">
                              {(item.unit_price * item.quantity).toLocaleString('fr-FR')} F
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                        <span className="flex items-center gap-1.5 text-sm text-stone-400">
                          {PAYMENT_LOGO[order.payment_method]
                            ? <img src={PAYMENT_LOGO[order.payment_method]} alt="" className="h-4 w-auto object-contain" />
                            : null
                          }
                          {PAYMENT_LABEL[order.payment_method]}
                        </span>
                        <span className="font-display font-bold text-forest-700">
                          {order.total_amount.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                      {(order.delivery_address || (order.delivery_latitude != null && order.delivery_longitude != null)) && (
                        <div className="flex items-start gap-2 text-xs text-stone-500 mt-3 bg-forest-50/60 border border-forest-100 rounded-lg px-3 py-2.5">
                          <MapPin className="w-3.5 h-3.5 text-forest-600 mt-0.5 shrink-0" />
                          <div>
                            {order.delivery_address && <p className="font-medium text-stone-700">{order.delivery_address}</p>}
                            {order.delivery_latitude != null && order.delivery_longitude != null && (
                              <a href={mapsLink(order.delivery_latitude, order.delivery_longitude)} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-forest-700 font-semibold hover:underline mt-0.5">
                                <LocateFixed className="w-3 h-3" /> Position GPS partagée — voir sur la carte
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                      {order.notes && (
                        <p className="text-xs text-stone-400 mt-2 italic bg-sand-50 rounded-lg px-3 py-2">
                          💬 {order.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
