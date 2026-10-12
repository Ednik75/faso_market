import { Link } from 'react-router-dom'
import { MapPin, Star, Package, ArrowUpRight } from 'lucide-react'
import CategoryIcon from './CategoryIcon'

export default function ShopCard({ shop }) {
  const rating = Number(shop.avg_rating || 0)

  return (
    <Link to={`/client/shop/${shop.id}`}
      className="group bg-white border border-paper-200 rounded-xl3 p-5 flex flex-col gap-4 transition-shadow hover:shadow-soft-md">

      {/* En-tête */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center shrink-0 overflow-hidden">
          {shop.logo_url
            ? <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
            : <CategoryIcon category={shop.category} className="w-6 h-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-sans font-semibold text-ink-900 text-base leading-tight truncate">{shop.name}</h3>
          <p className="text-xs text-stone-500 mt-1">{shop.category}</p>
        </div>
        <span className="w-9 h-9 rounded-full border border-paper-200 flex items-center justify-center text-ink-700 shrink-0 transition-colors group-hover:bg-ink-900 group-hover:text-white group-hover:border-ink-900">
          <ArrowUpRight className="w-4 h-4" />
        </span>
      </div>

      {shop.address && (
        <p className="flex items-start gap-2 text-xs text-stone-500">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-px text-brand-500" />
          <span className="line-clamp-1">{shop.address}</span>
        </p>
      )}

      {shop.description && (
        <p className="text-sm text-stone-500 line-clamp-2 -mt-1">{shop.description}</p>
      )}

      {/* Métriques */}
      <div className="flex items-center gap-4 pt-3 mt-auto border-t border-paper-100 text-xs">
        <span className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-accent-500 fill-accent-400" />
          <span className="font-semibold text-ink-900">{rating.toFixed(1)}</span>
          <span className="text-stone-400">({shop.review_count || 0})</span>
        </span>
        <span className="flex items-center gap-1 text-stone-500">
          <Package className="w-3.5 h-3.5" /> {shop.product_count || 0} produits
        </span>
        {shop.distance != null && (
          <span className="ml-auto font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
            {shop.distance.toFixed(1)} km
          </span>
        )}
      </div>
    </Link>
  )
}
