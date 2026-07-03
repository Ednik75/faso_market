import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'
import { useAuth } from '../../contexts/AuthContext'
import { Search, ShoppingCart, ChevronRight, Package } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { key: 'all',        label: 'Tous',               emoji: '🛍️' },
  { key: 'food',       label: 'Alimentation',        emoji: '🌾' },
  { key: 'fashion',   label: 'Mode & Vêtements',    emoji: '👗' },
  { key: 'health',    label: 'Santé & Beauté',       emoji: '✨' },
  { key: 'other',     label: 'Autre',                emoji: '📦' },
]

const FOOD_CATS    = ['Céréales', 'Légumineuses', 'Huiles', 'Épices & Condiments', 'Boissons', 'Alimentation']
const FASHION_CATS = ['Pagnes & Tissus', 'Boubous', 'Robes', 'Chaussures', 'Accessoires', 'Mode & Vêtements']
const HEALTH_CATS  = ['Corps & Beauté', 'Santé & Beauté']

function getCategoryKey(cat) {
  if (FOOD_CATS.some(c => cat?.includes(c) || c === cat))    return 'food'
  if (FASHION_CATS.some(c => cat?.includes(c) || c === cat)) return 'fashion'
  if (HEALTH_CATS.some(c => cat?.includes(c) || c === cat))  return 'health'
  return 'other'
}

function ProductCard({ product, onAdd }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <div className="card group flex-shrink-0 w-44 sm:w-52 hover:shadow-glass-md transition-all duration-200">
      <div className="relative h-32 sm:h-36 bg-sand-100 rounded-xl overflow-hidden mb-3">
        {product.image_url && !imgErr ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded-full">Indisponible</span>
          </div>
        )}
      </div>
      <p className="font-display font-semibold text-stone-900 text-sm leading-tight line-clamp-2 mb-1">{product.name}</p>
      <p className="text-forest-600 font-bold text-sm mb-3">{product.price.toLocaleString('fr-FR')} FCFA</p>
      <button
        onClick={() => onAdd(product)}
        disabled={!product.is_available}
        className="w-full flex items-center justify-center gap-1.5 bg-forest-50 hover:bg-forest-100 text-forest-700 text-xs font-semibold py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ShoppingCart className="w-3.5 h-3.5" /> Ajouter
      </button>
    </div>
  )
}

function CategorySection({ title, emoji, products, onAdd, onSeeAll }) {
  const scrollRef = useRef(null)
  if (products.length === 0) return null
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl text-stone-900 flex items-center gap-2">
          <span className="text-2xl">{emoji}</span> {title}
        </h2>
        <button onClick={onSeeAll} className="flex items-center gap-1 text-forest-600 text-sm font-semibold hover:underline">
          Voir tout <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {products.map(p => (
          <ProductCard key={p.id} product={p} onAdd={onAdd} />
        ))}
      </div>
    </div>
  )
}

export default function Catalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch]     = useState('')
  const { addToCart } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/products')
      .then(({ data }) => setProducts(data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = (product) => {
    addToCart(product)
    toast.success(`${product.name} ajouté au panier`, { icon: '🛒' })
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchTab    = activeTab === 'all' || getCategoryKey(p.category) === activeTab
    return matchSearch && matchTab
  })

  const foodProducts    = filtered.filter(p => getCategoryKey(p.category) === 'food')
  const fashionProducts = filtered.filter(p => getCategoryKey(p.category) === 'fashion')
  const healthProducts  = filtered.filter(p => getCategoryKey(p.category) === 'health')
  const otherProducts   = filtered.filter(p => getCategoryKey(p.category) === 'other')

  const showSections = activeTab === 'all' && !search

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="page-container max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="text-stone-400 text-sm font-display mb-1">🛍️ Catalogue</p>
          <h1 className="font-display font-black text-3xl text-stone-900">Nos produits</h1>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            className="input pl-11 w-full"
            placeholder="Rechercher mil, pagne, karité…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-7 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSearch('') }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold shrink-0 transition-all ${
                activeTab === key
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card h-56 animate-pulse bg-stone-50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-20">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-stone-300" />
            </div>
            <p className="font-display font-bold text-stone-500 text-lg mb-1">Aucun produit trouvé</p>
            <p className="text-stone-400 text-sm">Essayez un autre terme ou catégorie</p>
          </div>
        ) : showSections ? (
          <>
            <CategorySection
              title="Alimentation"
              emoji="🌾"
              products={foodProducts}
              onAdd={handleAdd}
              onSeeAll={() => setActiveTab('food')}
            />
            <CategorySection
              title="Mode & Vêtements"
              emoji="👗"
              products={fashionProducts}
              onAdd={handleAdd}
              onSeeAll={() => setActiveTab('fashion')}
            />
            <CategorySection
              title="Santé & Beauté"
              emoji="✨"
              products={healthProducts}
              onAdd={handleAdd}
              onSeeAll={() => setActiveTab('health')}
            />
            <CategorySection
              title="Autre"
              emoji="📦"
              products={otherProducts}
              onAdd={handleAdd}
              onSeeAll={() => setActiveTab('other')}
            />
          </>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="card group hover:shadow-glass-md transition-all duration-200">
                <div className="relative h-36 bg-sand-100 rounded-xl overflow-hidden mb-3">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                  )}
                  {!p.is_available && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded-full">Indisponible</span>
                    </div>
                  )}
                </div>
                <p className="font-display font-semibold text-stone-900 text-sm leading-tight line-clamp-2 mb-1">{p.name}</p>
                <p className="text-forest-600 font-bold text-sm mb-3">{p.price.toLocaleString('fr-FR')} FCFA</p>
                <button
                  onClick={() => handleAdd(p)}
                  disabled={!p.is_available}
                  className="w-full flex items-center justify-center gap-1.5 bg-forest-50 hover:bg-forest-100 text-forest-700 text-xs font-semibold py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Ajouter au panier
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
