import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import ProductCard from '../../components/ProductCard'
import StarRating from '../../components/StarRating'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/axios'
import { MapPin, Store, Send, Star, Package, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ShopDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [shop, setShop] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [shopRes, reviewsRes] = await Promise.all([
        api.get(`/shops/${id}`),
        api.get(`/reviews/shop/${id}`),
      ])
      setShop(shopRes.data)
      setReviews(reviewsRes.data)
    } catch { toast.error('Boutique introuvable') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [id])

  const submitReview = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/reviews', { shop_id: parseInt(id), rating, comment })
      toast.success('Avis publié !')
      setComment('')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="page-container">
        <div className="card h-48 animate-pulse bg-stone-50 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="rounded-xl3 h-64 animate-pulse bg-stone-100" />)}
        </div>
      </div>
    </div>
  )
  if (!shop) return null

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="page-container max-w-5xl mx-auto">

        {/* Shop header */}
        <div className="relative overflow-hidden rounded-xl3 bg-gradient-forest p-8 mb-8">
          <div className="absolute inset-0 bg-pattern-geo opacity-20" />
          <div className="relative z-10 flex items-start gap-5">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center shrink-0">
              <Store className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="font-display font-black text-3xl text-white mb-2">{shop.name}</h1>
                  <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {shop.category}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <StarRating value={Math.round(shop.avg_rating)} />
                    <span className="text-white/70 text-sm">({shop.review_count} avis)</span>
                  </div>
                </div>
              </div>
              {shop.description && (
                <p className="text-white/70 mt-3 text-sm leading-relaxed">{shop.description}</p>
              )}
              {shop.address && (
                <div className="flex items-center gap-1.5 mt-3 text-white/60 text-sm">
                  <MapPin className="w-4 h-4 shrink-0" />{shop.address}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-forest-50 rounded-xl flex items-center justify-center">
              <Package className="w-4 h-4 text-forest-600" />
            </div>
            <h2 className="font-display font-bold text-stone-900 text-xl">
              Produits <span className="text-stone-400 font-normal text-base">({shop.products?.length || 0})</span>
            </h2>
          </div>
          {!shop.products?.length ? (
            <div className="card text-center py-12 text-stone-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun produit disponible pour l'instant</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {shop.products.map(p => <ProductCard key={p.id} product={p} showShop={false} />)}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-gold-50 rounded-xl flex items-center justify-center">
              <Star className="w-4 h-4 text-gold-600" />
            </div>
            <h2 className="font-display font-bold text-stone-900 text-xl">
              Avis clients <span className="text-stone-400 font-normal text-base">({reviews.length})</span>
            </h2>
          </div>

          {user?.role === 'client' && (
            <div className="card mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gold-50 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-gold-600" />
                </div>
                <h3 className="font-display font-bold text-stone-900">Laisser un avis</h3>
              </div>
              <form onSubmit={submitReview}>
                <div className="mb-4">
                  <label className="field-label mb-2">Votre note</label>
                  <StarRating value={rating} onChange={setRating} size="lg" />
                </div>
                <textarea
                  className="input mb-4"
                  rows={3}
                  placeholder="Décrivez votre expérience avec cette boutique…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button type="submit" disabled={submitting} className="btn-gold btn-md flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  {submitting ? 'Publication…' : 'Publier l\'avis'}
                </button>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-forest-100 rounded-full flex items-center justify-center">
                      <span className="text-forest-700 font-bold text-sm font-display">
                        {r.client_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-display font-semibold text-stone-900 text-sm">{r.client_name}</span>
                  </div>
                  <StarRating value={r.rating} size="sm" />
                </div>
                {r.comment && <p className="text-stone-600 text-sm leading-relaxed">{r.comment}</p>}
                <p className="text-xs text-stone-400 mt-2">
                  {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="card text-center py-10 text-stone-400">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Aucun avis pour l'instant — soyez le premier !</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
