import { useState } from 'react'
import { ShoppingBag, MapPin, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import CategoryIcon from './CategoryIcon'
import { formatDistance } from '../utils/geo'

export default function ProductCard({ product, showShop = true }) {
  const { user, addToCart } = useAuth()
  const [imgErr, setImgErr] = useState(false)
  const inStock = (product.stock_quantity ?? 0) > 0
  const isLow   = inStock && (product.stock_quantity ?? 0) <= (product.low_stock_threshold ?? 5)

  const handleAdd = () => {
    if (!inStock) return
    addToCart(product)
    toast.success(`${product.name} ajouté au panier`, { icon: <ShoppingBag className="w-4 h-4 text-brand-600" /> })
  }

  return (
    <div className="group bg-white border border-paper-200 rounded-xl3 overflow-hidden flex flex-col transition-shadow hover:shadow-soft-md">
      {/* Visuel */}
      <div className="relative aspect-[4/3] bg-paper-100 overflow-hidden">
        {product.image_url && !imgErr ? (
          <img src={product.image_url} alt={product.name} loading="lazy" onError={() => setImgErr(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-paper-400">
            <CategoryIcon category={product.category} className="w-11 h-11" strokeWidth={1.25} />
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          <span className="bg-white/95 text-ink-800 text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {product.category}
          </span>
          {isLow && (
            <span className="inline-flex items-center gap-1 bg-accent-400 text-ink-900 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3" /> Stock faible
            </span>
          )}
        </div>

        <span className={`absolute top-3 right-3 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
          inStock ? 'bg-ink-900/85 text-white' : 'bg-white/95 text-danger-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-400' : 'bg-danger-500'}`} />
          {inStock ? `${product.stock_quantity} dispo` : 'Rupture'}
        </span>
      </div>

      {/* Contenu */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1">
          <h3 className="font-sans font-semibold text-ink-900 text-[15px] leading-snug line-clamp-2">
            {product.name}
          </h3>
          {showShop && product.shop_name && (
            <Link to={`/client/shop/${product.shop_id}`}
              className="inline-flex items-center gap-1 mt-1 text-xs text-stone-500 hover:text-brand-700 font-medium">
              <MapPin className="w-3 h-3" /> {product.shop_name}
              {product.distance != null && (
                <span className="font-semibold text-brand-700">· {formatDistance(product.distance)}</span>
              )}
            </Link>
          )}
          {product.description && (
            <p className="text-xs text-stone-500 mt-1.5 line-clamp-2">{product.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-paper-100">
          <p className="font-display text-xl text-ink-900 tabular-nums">
            {product.price.toLocaleString('fr-FR')}
            <span className="font-sans text-xs text-stone-500 ml-1">FCFA</span>
          </p>

          {user?.role === 'client' && (
            <button onClick={handleAdd} disabled={!inStock}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${
                inStock
                  ? 'bg-ink-900 text-white hover:bg-brand-600'
                  : 'bg-paper-100 text-stone-400 cursor-not-allowed'
              }`}>
              <ShoppingBag className="w-3.5 h-3.5" />
              {inStock ? 'Ajouter' : 'Indispo'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
