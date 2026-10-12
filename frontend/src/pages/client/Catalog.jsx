import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import ProductCard from '../../components/ProductCard'
import { PositionChip, RadiusFilter } from '../../components/LocationBar'
import { usePosition } from '../../contexts/PositionContext'
import { sortByDistance } from '../../utils/geo'
import api from '../../api/axios'
import { Search, Package, LayoutGrid, Wheat, Shirt, Sparkles, ShoppingBag, X } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { key: 'all',     label: 'Tous',             icon: LayoutGrid },
  { key: 'food',    label: 'Alimentation',     icon: Wheat },
  { key: 'fashion', label: 'Mode & Vêtements', icon: Shirt },
  { key: 'health',  label: 'Santé & Beauté',   icon: Sparkles },
  { key: 'other',   label: 'Autre',            icon: Package },
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

const normalize = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const SORTS = [
  { key: 'distance',   label: 'Plus proche' },
  { key: 'price_asc',  label: 'Prix croissant' },
  { key: 'price_desc', label: 'Prix décroissant' },
]

export default function Catalog() {
  const { position, radius, setRadius } = usePosition()
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState(params.get('q') || '')
  const [sort, setSort] = useState('distance')

  useEffect(() => {
    api.get('/products')
      .then(({ data }) => setProducts(data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  // Garde la recherche dans l'URL (partage du lien, bouton retour)
  useEffect(() => {
    const t = setTimeout(() => setParams(search ? { q: search } : {}, { replace: true }), 300)
    return () => clearTimeout(t)
  }, [search])

  const results = useMemo(() => {
    const q = normalize(search.trim())
    const filtered = products.filter(p => {
      const matchSearch = !q || normalize(`${p.name} ${p.category} ${p.description || ''} ${p.shop_name || ''}`).includes(q)
      const matchTab = activeTab === 'all' || getCategoryKey(p.category) === activeTab
      return matchSearch && matchTab
    })
    const withDist = sortByDistance(filtered, position, position ? radius : null)
    if (sort === 'price_asc')  return [...withDist].sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') return [...withDist].sort((a, b) => b.price - a.price)
    return withDist
  }, [products, search, activeTab, position, radius, sort])

  return (
    <div className="min-h-screen bg-paper-50">
      <Navbar />
      <div className="page-container">

        <header className="mb-6">
          <p className="eyebrow mb-3"><ShoppingBag className="w-3.5 h-3.5" /> Produits</p>
          <h1 className="page-title">
            {position ? <>Disponible <em className="text-brand-600 font-normal">près de vous</em></> : 'Tous les produits'}
          </h1>
        </header>

        {/* Recherche */}
        <div className="relative mb-4 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input className="input pl-11 pr-10 py-3.5 rounded-full" placeholder="Mil, karité, pagne, sandales…"
            value={search} onChange={e => setSearch(e.target.value)} aria-label="Rechercher un produit" />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:bg-paper-100">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Position, rayon, tri */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <PositionChip />
          <RadiusFilter />
          <label className="ml-auto flex items-center gap-2 text-xs text-stone-500">
            Trier par
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="bg-white border border-paper-300 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-900 focus:outline-none focus:border-brand-500">
              {SORTS.map(s => (
                <option key={s.key} value={s.key}>{s.key === 'distance' && !position ? 'Plus récents' : s.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Catégories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border shrink-0 transition-colors ${
                activeTab === key ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-ink-700 border-paper-300 hover:border-ink-900'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {!loading && (
          <p className="text-sm text-stone-500 mb-5">
            <span className="font-semibold text-ink-900">{results.length}</span> produit{results.length > 1 ? 's' : ''}
            {position && radius ? ` à moins de ${radius} km` : ''}
            {position && sort === 'distance' ? ' · du plus proche au plus loin' : ''}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="rounded-xl3 h-72 animate-pulse bg-paper-100" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="card text-center py-14">
            <span className="w-12 h-12 rounded-2xl bg-paper-100 text-paper-500 flex items-center justify-center mx-auto mb-4">
              <Package className="w-5 h-5" />
            </span>
            <p className="font-semibold text-ink-900">Aucun produit trouvé{position && radius ? ` à moins de ${radius} km` : ''}</p>
            <p className="text-sm text-stone-500 mt-1">Essayez un autre mot ou élargissez la zone.</p>
            {position && radius && (
              <button onClick={() => setRadius(null)} className="btn-outline mt-5">Chercher dans tout le Burkina</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
