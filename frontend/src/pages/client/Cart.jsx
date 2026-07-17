import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/axios'
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, ArrowRight, MapPin, Phone, MessageSquare, LocateFixed, Loader2, X, CheckCircle2 } from 'lucide-react'
import { getCurrentPosition, BF_CITIES, OUAGA_QUARTIERS } from '../../utils/geo'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { value: 'orange_money',    label: 'Orange Money',            logo: '/orange.png',  needsPhone: true },
  { value: 'moov_money',      label: 'Moov Money',              logo: '/moov.png',    needsPhone: true },
  { value: 'wave',            label: 'Wave',                    logo: '/wave.png',    needsPhone: true },
  { value: 'cash_on_delivery',label: 'Paiement à la livraison', emoji: '💵',          needsPhone: false },
]

export default function Cart() {
  const { cart, updateCartQty, removeFromCart, clearCart, cartTotal, user } = useAuth()
  const [paymentMethod, setPaymentMethod]     = useState('cash_on_delivery')
  const [phone, setPhone]                     = useState(user?.phone || '')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [gps, setGps]                         = useState(null)   // { latitude, longitude, accuracy }
  const [gpsLoading, setGpsLoading]           = useState(false)
  const [notes, setNotes]                     = useState('')
  const [loading, setLoading]                 = useState(false)
  const navigate = useNavigate()

  const shareLocation = async () => {
    setGpsLoading(true)
    try {
      const pos = await getCurrentPosition()
      setGps(pos)
      toast.success('Position enregistrée ! Elle sera transmise au livreur. 📍')
    } catch (err) {
      toast.error(err.message)
    } finally { setGpsLoading(false) }
  }

  const selectedMethod = PAYMENT_METHODS.find(m => m.value === paymentMethod)
  const shopId = cart[0]?.product?.shop_id

  const handleOrder = async () => {
    if (cart.length === 0) return

    // Validation
    if (!deliveryAddress.trim()) {
      toast.error('Veuillez indiquer une adresse de livraison')
      return
    }
    if (selectedMethod?.needsPhone && !phone.trim()) {
      toast.error(`Entrez votre numéro ${selectedMethod.label} à débiter`)
      return
    }

    const shopIds = [...new Set(cart.map(i => i.product.shop_id))]
    if (shopIds.length > 1) {
      toast.error('Votre panier contient des produits de plusieurs boutiques. Commandez boutique par boutique.')
      return
    }

    // Notes pour le commerçant (l'adresse et le GPS partent dans des champs dédiés)
    const fullNotes = [
      selectedMethod?.needsPhone ? `📱 Paiement ${selectedMethod.label} : ${phone}` : null,
      notes.trim() ? `💬 ${notes}` : null,
    ].filter(Boolean).join('\n')

    setLoading(true)
    try {
      await api.post('/orders', {
        shop_id: shopId,
        items: cart.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        payment_method: paymentMethod,
        notes: fullNotes || null,
        delivery_address: deliveryAddress,
        delivery_latitude: gps?.latitude ?? null,
        delivery_longitude: gps?.longitude ?? null,
      })
      clearCart()
      toast.success('Commande passée avec succès ! 🎉 Un reçu vous a été envoyé par email.', { duration: 5000 })
      navigate('/client/orders')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la commande')
    } finally { setLoading(false) }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-sand-50">
        <Navbar />
        <div className="page-container max-w-2xl mx-auto">
          <div className="card text-center py-24">
            <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <ShoppingCart className="w-10 h-10 text-stone-300" />
            </div>
            <h2 className="font-display font-bold text-xl text-stone-700 mb-2">Votre panier est vide</h2>
            <p className="text-stone-400 mb-7">Ajoutez des produits depuis les boutiques Market BF</p>
            <button onClick={() => navigate('/client/search')} className="btn-primary btn-md">
              Parcourir les produits <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="page-container max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-stone-400 text-sm font-display mb-1">🛒 Commande</p>
          <h1 className="font-display font-black text-3xl text-stone-900">Mon panier</h1>
        </div>

        {/* Articles */}
        <div className="space-y-3 mb-6">
          {cart.map(({ product, quantity }) => (
            <div key={product.id} className="card flex items-center gap-4">
              <div className="w-14 h-14 bg-sand-100 rounded-xl flex items-center justify-center shrink-0 text-2xl">
                📦
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-stone-900 truncate">{product.name}</p>
                <p className="text-sm text-forest-600 font-semibold mt-0.5">
                  {product.price.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => updateCartQty(product.id, quantity - 1)}
                  className="w-8 h-8 rounded-xl border border-stone-200 bg-white flex items-center justify-center hover:bg-stone-50 transition-all">
                  <Minus className="w-3 h-3 text-stone-600" />
                </button>
                <span className="w-8 text-center font-display font-bold text-stone-900">{quantity}</span>
                <button onClick={() => updateCartQty(product.id, quantity + 1)}
                  className="w-8 h-8 rounded-xl border border-stone-200 bg-white flex items-center justify-center hover:bg-stone-50 transition-all">
                  <Plus className="w-3 h-3 text-stone-600" />
                </button>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display font-bold text-stone-900">
                  {(product.price * quantity).toLocaleString('fr-FR')} F
                </p>
                <button onClick={() => removeFromCart(product.id)}
                  className="text-crimson-400 hover:text-crimson-600 mt-1.5 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Méthode de paiement ── */}
        <div className="card mb-4">
          <h3 className="font-display font-bold text-stone-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-forest-600" /> Méthode de paiement
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(({ value, label, logo, emoji }) => (
              <button key={value} type="button" onClick={() => setPaymentMethod(value)}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                  paymentMethod === value
                    ? 'border-forest-500 bg-forest-50 shadow-forest/20 shadow-sm'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}>
                <div className="h-8 flex items-center mb-2">
                  {logo
                    ? <img src={logo} alt={label} className="h-7 w-auto object-contain" />
                    : <span className="text-2xl">{emoji}</span>
                  }
                </div>
                <p className={`font-semibold text-sm font-display ${paymentMethod === value ? 'text-forest-700' : 'text-stone-700'}`}>
                  {label}
                </p>
              </button>
            ))}
          </div>

          {/* Numéro de paiement mobile — affiché uniquement si besoin */}
          {selectedMethod?.needsPhone && (
            <div className="mt-4 animate-fade-up">
              <div className="bg-gold-50 border border-gold-200 rounded-xl p-4">
                <label className="field-label flex items-center gap-2 text-gold-800">
                  <Phone className="w-4 h-4" />
                  Numéro {selectedMethod.label} à débiter <span className="text-crimson-500">*</span>
                </label>
                <input
                  className="input mt-1"
                  type="tel"
                  placeholder="+226 70 00 00 00"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
                <p className="text-xs text-gold-700 mt-1.5">
                  Ce numéro sera débité du montant total de la commande.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Adresse de livraison ── */}
        <div className="card mb-4">
          <h3 className="font-display font-bold text-stone-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-forest-600" /> Livraison <span className="text-crimson-500 text-sm">*</span>
          </h3>
          <input
            className="input mb-3"
            type="text"
            placeholder="Ville, quartier, repère… (ex: Bobo-Dioulasso, Accart-Ville, près de la gare)"
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
            maxLength={200}
            required
          />

          {/* Suggestions : quartiers de Ouaga + villes du Burkina */}
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-1.5">Ouagadougou</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {OUAGA_QUARTIERS.map(q => (
              <button key={q} type="button"
                onClick={() => setDeliveryAddress(`${q}, Ouagadougou`)}
                className="text-xs bg-stone-100 hover:bg-forest-100 text-stone-600 hover:text-forest-700 px-2.5 py-1 rounded-full transition-colors font-medium">
                {q}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-1.5">Autres villes du Burkina</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {BF_CITIES.filter(c => c !== 'Ouagadougou').map(c => (
              <button key={c} type="button"
                onClick={() => setDeliveryAddress(`${c}`)}
                className="text-xs bg-stone-100 hover:bg-gold-100 text-stone-600 hover:text-gold-700 px-2.5 py-1 rounded-full transition-colors font-medium">
                {c}
              </button>
            ))}
          </div>

          {/* Partage de position GPS */}
          {gps ? (
            <div className="flex items-start gap-3 bg-forest-50 border border-forest-200 rounded-xl p-4">
              <CheckCircle2 className="w-5 h-5 text-forest-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-forest-800">Position GPS partagée</p>
                <p className="text-xs text-forest-700/70 mt-0.5 tabular-nums">
                  {gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)}
                  {gps.accuracy ? ` · précision ~${Math.round(gps.accuracy)} m` : ''}
                </p>
                <p className="text-xs text-forest-700/70 mt-1">
                  Le livreur recevra votre position exacte avec un lien vers la carte.
                </p>
              </div>
              <button type="button" onClick={() => setGps(null)}
                className="p-1.5 text-forest-400 hover:text-forest-700 hover:bg-forest-100 rounded-lg transition-colors shrink-0"
                title="Retirer ma position" aria-label="Retirer ma position">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={shareLocation}
              disabled={gpsLoading}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-stone-200 hover:border-forest-400 hover:bg-forest-50 text-stone-600 hover:text-forest-700 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {gpsLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Localisation en cours…</>
                : <><LocateFixed className="w-4 h-4" /> Partager ma position GPS pour faciliter la livraison</>
              }
            </button>
          )}
          <p className="text-[11px] text-stone-400 mt-2">
            Optionnel mais recommandé : votre position exacte aide le livreur à vous trouver, partout au Burkina Faso.
          </p>
        </div>

        {/* ── Instructions supplémentaires ── */}
        <div className="card mb-6">
          <h3 className="font-display font-bold text-stone-900 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-stone-400" />
            Instructions supplémentaires <span className="text-stone-400 text-xs font-normal">(optionnel)</span>
          </h3>
          <textarea
            className="input"
            rows={2}
            placeholder="Horaires de disponibilité, préférences d'emballage…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={250}
          />
        </div>

        {/* ── Récapitulatif ── */}
        <div className="card">
          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm text-stone-500">
              <span>Sous-total ({cart.reduce((s, i) => s + i.quantity, 0)} article(s))</span>
              <span>{cartTotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between text-sm text-stone-500">
              <span>Livraison</span>
              <span className="text-forest-600 font-semibold">À convenir</span>
            </div>
          </div>
          <div className="flex justify-between font-display font-black text-xl border-t border-stone-100 pt-3 mb-5">
            <span className="text-stone-900">Total</span>
            <span className="text-forest-700">{cartTotal.toLocaleString('fr-FR')} FCFA</span>
          </div>

          {/* Récap adresse + paiement */}
          {(deliveryAddress || gps || (selectedMethod?.needsPhone && phone)) && (
            <div className="bg-sand-50 rounded-xl p-3.5 mb-4 space-y-1.5 text-sm">
              {deliveryAddress && (
                <p className="flex items-start gap-2 text-stone-600">
                  <MapPin className="w-4 h-4 text-forest-500 mt-0.5 shrink-0" />
                  {deliveryAddress}
                </p>
              )}
              {gps && (
                <p className="flex items-center gap-2 text-stone-600">
                  <LocateFixed className="w-4 h-4 text-forest-500 shrink-0" />
                  Position GPS partagée <span className="text-stone-400 tabular-nums text-xs">({gps.latitude.toFixed(4)}, {gps.longitude.toFixed(4)})</span>
                </p>
              )}
              {selectedMethod?.needsPhone && phone && (
                <p className="flex items-center gap-2 text-stone-600">
                  <Phone className="w-4 h-4 text-gold-500 shrink-0" />
                  {selectedMethod.label} · {phone}
                </p>
              )}
            </div>
          )}

          <button onClick={handleOrder} disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Commande en cours…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Passer la commande <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
