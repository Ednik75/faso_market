import { ShoppingCart, Package, Star, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const CAT_COLORS = {
  'Céréales':           'bg-gold-100 text-gold-700',
  'Légumineuses':       'bg-forest-100 text-forest-700',
  'Huiles':             'bg-gold-100 text-gold-800',
  'Épices & Condiments':'bg-crimson-100 text-crimson-700',
  'Boissons':           'bg-forest-100 text-forest-600',
  'Corps & Beauté':     'bg-sand-200 text-sand-800',
  'Pagnes & Tissus':    'bg-gold-100 text-gold-700',
  'Boubous':            'bg-forest-100 text-forest-700',
  'Robes':              'bg-crimson-100 text-crimson-600',
  'Chaussures':         'bg-stone-100 text-stone-700',
  'Accessoires':        'bg-sand-200 text-sand-700',
}

export default function ProductCard({ product, showShop = true }) {
  const { user, addToCart } = useAuth()
  const inStock = (product.stock_quantity ?? 0) > 0
  const isLow   = inStock && (product.stock_quantity ?? 0) <= (product.low_stock_threshold ?? 5)

  const handleAdd = () => {
    if (!inStock) return
    addToCart(product)
    toast.success(`${product.name} ajouté !`, { icon: '🛒' })
  }

  return (
    <div className="group card-hover flex flex-col overflow-hidden !p-0">
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-sand-100 to-sand-200 overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Package className="w-10 h-10 text-sand-400" />
            <span className="text-xs text-sand-400 font-medium">{product.category}</span>
          </div>
        )}

        {/* Badges top */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className={`badge text-[10px] ${CAT_COLORS[product.category] || 'bg-stone-100 text-stone-600'}`}>
            {product.category}
          </span>
          {isLow && (
            <span className="badge bg-crimson-500 text-white text-[10px] animate-pulse">
              <Zap className="w-2.5 h-2.5" /> Stock faible
            </span>
          )}
        </div>

        {/* Stock pill */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm ${
          inStock ? 'bg-forest-500/90 text-white' : 'bg-stone-800/80 text-white'
        }`}>
          {inStock ? `${product.stock_quantity} dispo` : 'Rupture'}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1">
          <h3 className="font-display font-semibold text-stone-900 text-sm leading-snug line-clamp-2 mb-1">
            {product.name}
          </h3>
          {showShop && product.shop_name && (
            <Link to={`/client/shop/${product.shop_id}`}
              className="text-xs text-forest-600 hover:text-forest-700 font-medium hover:underline">
              📍 {product.shop_name}
            </Link>
          )}
          {product.description && (
            <p className="text-xs text-stone-400 mt-1.5 line-clamp-2">{product.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-display font-bold text-lg text-forest-700">
              {product.price.toLocaleString('fr-FR')}
            </span>
            <span className="text-xs text-stone-400 ml-1">FCFA</span>
          </div>

          {user?.role === 'client' && (
            <button onClick={handleAdd} disabled={!inStock}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                inStock
                  ? 'bg-forest-600 text-white hover:bg-forest-700 hover:shadow-forest active:scale-95'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}>
              <ShoppingCart className="w-3.5 h-3.5" />
              {inStock ? 'Ajouter' : 'Indispo'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
