import { Link } from 'react-router-dom'
import { Store, MapPin, Star, Package, ArrowRight } from 'lucide-react'

const CAT_ICONS = {
  'Alimentation':          '🛒',
  'Céréales & Légumineuses':'🌾',
  'Mode & Vêtements':      '👗',
  'Pagnes & Tissus':       '🧵',
  'Santé & Beauté':        '✨',
  'Produits naturels':     '🌿',
  'Électronique':          '📱',
  'Artisanat burkinabè':   '🏺',
  'Agriculture & Élevage': '🌱',
  'Maison & Décoration':   '🏠',
  'Général':               '🏪',
}

const RATING_COLORS = ['', 'text-red-400', 'text-orange-400', 'text-amber-400', 'text-yellow-400', 'text-gold-500']

export default function ShopCard({ shop }) {
  const rating = Math.round(shop.avg_rating || 0)
  const emoji  = CAT_ICONS[shop.category] || '🏪'

  return (
    <Link to={`/client/shop/${shop.id}`}
      className="group card-hover flex flex-col overflow-hidden !p-0 block">

      {/* Header coloré */}
      <div className="h-24 bg-gradient-to-br from-forest-700 to-forest-900 relative overflow-hidden flex items-center px-5 gap-4">
        <div className="absolute inset-0 bg-pattern-geo opacity-100 pointer-events-none" />

        {/* Avatar */}
        <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shrink-0">
          {shop.logo_url
            ? <img src={shop.logo_url} alt={shop.name} className="w-full h-full rounded-2xl object-cover" />
            : <span className="text-2xl">{emoji}</span>
          }
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-white text-base leading-tight truncate">
            {shop.name}
          </h3>
          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-white/20 rounded-full text-[10px] text-white/90 font-medium">
            {shop.category}
          </span>
        </div>

        <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        {shop.address && (
          <div className="flex items-start gap-2 text-xs text-stone-500">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-forest-500" />
            <span className="line-clamp-1">{shop.address}</span>
          </div>
        )}

        {shop.description && (
          <p className="text-xs text-stone-400 line-clamp-2">{shop.description}</p>
        )}

        {/* Footer métriques */}
        <div className="flex items-center gap-4 pt-2 border-t border-stone-100">
          {/* Étoiles */}
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-3 h-3 ${s <= rating ? 'text-gold-500 fill-gold-500' : 'text-stone-200 fill-stone-200'}`} />
              ))}
            </div>
            <span className="text-xs font-semibold text-stone-700">{Number(shop.avg_rating||0).toFixed(1)}</span>
            <span className="text-xs text-stone-400">({shop.review_count||0})</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-stone-400 ml-auto">
            <Package className="w-3 h-3" />
            <span>{shop.product_count||0} produits</span>
          </div>

          {shop.distance != null && (
            <span className="text-xs font-semibold text-forest-600">
              {shop.distance.toFixed(1)} km
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
