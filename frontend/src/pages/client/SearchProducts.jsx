import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import ProductCard from '../../components/ProductCard'
import api from '../../api/axios'
import { Search, SlidersHorizontal, X, Package } from 'lucide-react'

const CATEGORIES = ['Alimentation', 'Céréales', 'Huiles', 'Boissons', 'Mode & Vêtements', 'Robes', 'Chaussures', 'Accessoires', 'Électronique']

export default function SearchProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (category) params.category = category
      if (minPrice) params.min_price = minPrice
      if (maxPrice) params.max_price = maxPrice
      const { data } = await api.get('/products', { params })
      setProducts(data)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleSearch = (e) => { e.preventDefault(); fetchProducts() }
  const clearFilters = () => { setCategory(''); setMinPrice(''); setMaxPrice('') }
  const hasFilters = category || minPrice || maxPrice

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="page-container">

        {/* Header */}
        <div className="mb-8">
          <p className="text-stone-400 text-sm font-display mb-1">🛒 Marketplace</p>
          <h1 className="font-display font-black text-3xl text-stone-900">Recherche de produits</h1>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              className="input pl-10"
              placeholder="Mil, karité, bogolan, sandales…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary btn-md px-6">Rechercher</button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-md flex items-center gap-2 px-4 border-2 rounded-xl font-semibold transition-all ${
              showFilters || hasFilters
                ? 'border-forest-500 bg-forest-50 text-forest-700'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtres</span>
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-forest-500" />}
          </button>
        </form>

        {/* Filters panel */}
        {showFilters && (
          <div className="card mb-5 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-stone-900">Filtres avancés</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-crimson-500 hover:text-crimson-700 font-semibold flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Réinitialiser
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="field-label">Catégorie</label>
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Toutes les catégories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Prix minimum (FCFA)</label>
                <input className="input" type="number" placeholder="0" value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Prix maximum (FCFA)</label>
                <input className="input" type="number" placeholder="100 000" value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>
            <button onClick={fetchProducts} className="btn-primary btn-md mt-4">
              Appliquer les filtres
            </button>
          </div>
        )}

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {category && (
              <button onClick={() => setCategory('')}
                className="flex items-center gap-1.5 px-3 py-1 bg-forest-100 text-forest-700 rounded-full text-xs font-semibold hover:bg-forest-200 transition-colors">
                {category} <X className="w-3 h-3" />
              </button>
            )}
            {minPrice && (
              <button onClick={() => setMinPrice('')}
                className="flex items-center gap-1.5 px-3 py-1 bg-gold-100 text-gold-700 rounded-full text-xs font-semibold hover:bg-gold-200 transition-colors">
                Min: {parseInt(minPrice).toLocaleString('fr-FR')} F <X className="w-3 h-3" />
              </button>
            )}
            {maxPrice && (
              <button onClick={() => setMaxPrice('')}
                className="flex items-center gap-1.5 px-3 py-1 bg-gold-100 text-gold-700 rounded-full text-xs font-semibold hover:bg-gold-200 transition-colors">
                Max: {parseInt(maxPrice).toLocaleString('fr-FR')} F <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Count */}
        <p className="text-sm text-stone-400 font-medium mb-5">
          {loading ? 'Recherche en cours…' : `${products.length} produit(s) trouvé(s)`}
        </p>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,8].map(i => <div key={i} className="rounded-xl3 h-64 animate-pulse bg-stone-100" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="card text-center py-20">
            <Package className="w-14 h-14 mx-auto text-stone-200 mb-4" />
            <p className="font-display font-bold text-stone-500 text-lg mb-1">Aucun produit trouvé</p>
            <p className="text-stone-400 text-sm">Essayez d'autres mots-clés ou supprimez les filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
