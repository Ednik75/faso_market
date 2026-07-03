import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { Store, Search, MapPin, ShoppingCart, TrendingUp, Shield, Smartphone, ArrowRight, Package, Star } from 'lucide-react'

const FEATURES = [
  { icon: Search,       title: 'Recherche intelligente', desc: 'Trouvez mil, karité, bogolan ou pagne bazin dans toutes les boutiques de Ouagadougou.', color: 'bg-forest-600', bg: 'bg-forest-50' },
  { icon: MapPin,       title: 'Carte interactive',      desc: 'Boutiques géolocalisées dans tous les secteurs : Hamdallaye, Ouaga 2000, Zogona...', color: 'bg-gold-500',   bg: 'bg-gold-50' },
  { icon: ShoppingCart, title: 'Commande en ligne',      desc: 'Payez via Orange Money, Moov Money ou à la livraison — les modes BF.', color: 'bg-forest-500',  bg: 'bg-forest-50' },
  { icon: TrendingUp,   title: 'Gestion des stocks',     desc: 'Alertes automatiques quand votre stock baisse. Maîtrisez votre inventaire en temps réel.', color: 'bg-gold-600',   bg: 'bg-gold-50' },
  { icon: Shield,       title: 'Paiements sécurisés',    desc: 'Transactions protégées adaptées au marché burkinabè. Aucune carte bancaire requise.', color: 'bg-crimson-600', bg: 'bg-crimson-50' },
  { icon: Smartphone,   title: 'Optimisé mobile',        desc: 'Interface conçue pour les smartphones du Burkina, légère même sur réseau 3G.', color: 'bg-gold-700',   bg: 'bg-gold-50' },
]

const PAYMENTS = [
  { logo: '/orange.png', name: 'Orange Money',    sub: 'Très populaire' },
  { logo: '/moov.png',   name: 'Moov Money',      sub: 'Rapide & fiable' },
  { logo: '/wave.png',   name: 'Wave',            sub: 'Sans frais' },
  { emoji: '💵',         name: 'À la livraison',  sub: 'Paiement cash' },
]

const TICKER = ['🌾 Mil & Sorgho', '🫒 Karité pur', '🌿 Soumbala', '🫘 Niébé', '🧵 Bogolan', '👘 Pagne bazin', '👞 Sandales cuir', '🌻 Huile de coton', '🍚 Fonio bio', '🎩 Chapeau paille', '👗 Boubou', '🌱 Produits naturels']

const CAT_EMOJI = {
  'Alimentation': '🍽️', 'Céréales': '🌾', 'Huiles': '🫒', 'Boissons': '🥤',
  'Mode & Vêtements': '👗', 'Robes': '👗', 'Chaussures': '👞', 'Accessoires': '🎒',
  'Pagnes & Tissus': '🧵', 'Artisanat burkinabè': '🎨', 'Santé & Beauté': '💚',
  'Produits naturels': '🌿', 'Agriculture & Élevage': '🌱', 'Général': '📦',
}

export default function Home() {
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [visible, setVisible] = useState(false)
  const productsRef = useRef(null)

  useEffect(() => {
    api.get('/products')
      .then(({ data }) => setProducts(data.slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.05 }
    )
    if (productsRef.current) observer.observe(productsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="section-hero min-h-[92vh] flex flex-col items-center justify-center px-4 py-24">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-forest-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-8 text-sm font-medium text-white/90">
            <span className="text-lg">🇧🇫</span>
            La Marketplace du Burkina Faso
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6">
            Le commerce
            <span className="block">
              <span className="text-gradient-gold">burkinabè</span>
            </span>
            numérisé
          </h1>

          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Trouvez les boutiques proches de chez vous, vérifiez la disponibilité des produits en temps réel et commandez en quelques secondes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="btn-gold btn-lg shadow-gold animate-pulse-gold">
              Commencer gratuitement <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="btn-ghost btn-lg">Se connecter</Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-16">
            {[
              { value: '100%', label: 'Commerce local BF' },
              { value: 'Orange Money', label: 'Paiement mobile' },
              { value: 'Ouagadougou', label: 'Quartiers couverts' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-display font-bold text-2xl text-gold-400">{value}</p>
                <p className="text-white/50 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-float">
          <div className="w-px h-8 bg-white/20" />
          <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
        </div>
      </section>

      {/* ── TICKER PRODUITS ──────────────────────────────── */}
      <section className="py-10 bg-white overflow-hidden border-y border-sand-100">
        <p className="text-center text-xs font-semibold text-stone-400 uppercase tracking-widest mb-5 font-display">
          Produits phares du Burkina Faso
        </p>
        <div className="relative flex overflow-hidden">
          {/* Double le contenu pour le loop infini */}
          {[0, 1].map(pass => (
            <div
              key={pass}
              className="flex gap-3 shrink-0"
              style={{
                animation: 'ticker 30s linear infinite',
                animationDelay: pass === 1 ? '-15s' : '0s',
              }}
            >
              {TICKER.map(p => (
                <span
                  key={p}
                  className="bg-sand-50 border border-sand-200 text-stone-700 rounded-full px-5 py-2 text-sm font-medium whitespace-nowrap hover:bg-forest-50 hover:border-forest-200 hover:text-forest-700 transition-colors cursor-default"
                >
                  {p}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUITS ANIMÉS ──────────────────────────────── */}
      <section ref={productsRef} className="py-20 px-4 bg-sand-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-forest-600 font-semibold text-sm uppercase tracking-widest font-display mb-3">Catalogue live</p>
            <h2 className="section-title text-4xl md:text-5xl mb-4">
              Produits disponibles <span className="text-gradient-gold">maintenant</span>
            </h2>
            <p className="text-stone-500 max-w-xl mx-auto">
              Commandez directement auprès des commerçants de Ouagadougou
            </p>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-white rounded-xl3 h-64 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <Package className="w-14 h-14 mx-auto mb-3 opacity-20" />
              <p>Les produits apparaîtront ici</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product, i) => {
                const emoji = CAT_EMOJI[product.category] || '📦'
                return (
                  <div
                    key={product.id}
                    className="transition-all duration-700 ease-out"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'translateY(0)' : 'translateY(40px)',
                      transitionDelay: `${i * 80}ms`,
                    }}
                  >
                    <div className="card-hover group h-full flex flex-col">
                      {/* Image / emoji */}
                      <div className="relative mb-4 rounded-xl overflow-hidden bg-sand-50 aspect-square flex items-center justify-center text-5xl group-hover:scale-[1.02] transition-transform duration-300">
                        {product.image_url
                          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          : <span>{emoji}</span>
                        }
                        {/* Category badge */}
                        <div className="absolute top-2 left-2">
                          <span className="badge badge-green text-[10px] py-0.5">{product.category}</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col">
                        <p className="font-display font-bold text-stone-900 text-sm leading-tight mb-1 line-clamp-2">
                          {product.name}
                        </p>
                        {product.shop_name && (
                          <p className="text-xs text-stone-400 mb-2 flex items-center gap-1">
                            <Store className="w-3 h-3" /> {product.shop_name}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between">
                          <p className="font-display font-black text-forest-700 text-base">
                            {product.price.toLocaleString('fr-FR')}
                            <span className="text-xs font-medium text-stone-400 ml-0.5">F</span>
                          </p>
                          <Link
                            to="/login"
                            className="w-8 h-8 bg-forest-600 rounded-xl flex items-center justify-center hover:bg-forest-700 transition-colors shadow-forest/30 shadow-sm"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 text-white" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/register" className="btn-primary btn-lg">
              Voir tous les produits <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO GRID ──────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-forest-600 font-semibold text-sm uppercase tracking-widest font-display mb-3">Pourquoi Market BF ?</p>
            <h2 className="section-title text-4xl md:text-5xl mb-4">
              Tout en une<br /><span className="text-gradient-forest">seule plateforme</span>
            </h2>
            <p className="text-stone-500 max-w-xl mx-auto text-lg">
              Commerçants et clients du Burkina Faso : simplifiez votre quotidien avec des outils conçus pour vous.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="card-hover group">
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                <h3 className="font-display font-semibold text-stone-900 text-base mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA DOUBLE ───────────────────────────────────── */}
      <section className="py-20 px-4 bg-sand-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="relative overflow-hidden rounded-xl3 p-8 bg-gradient-to-br from-forest-800 to-forest-950">
            <div className="absolute inset-0 bg-pattern-geo" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <span className="badge bg-gold-500/20 text-gold-300 mb-4">Pour les clients</span>
              <h3 className="font-display font-bold text-white text-2xl mb-3">Achetez local</h3>
              <p className="text-white/60 mb-8 leading-relaxed">
                Découvrez les boutiques de Ouagadougou, commandez en ligne et payez avec Orange Money.
              </p>
              <Link to="/register" className="btn-gold btn-md inline-flex">
                Créer un compte client <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl3 p-8 bg-gradient-to-br from-gold-600 to-gold-800">
            <div className="absolute inset-0 bg-pattern-geo" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                <Store className="w-7 h-7 text-white" />
              </div>
              <span className="badge bg-white/20 text-white mb-4">Pour les commerçants</span>
              <h3 className="font-display font-bold text-white text-2xl mb-3">Vendez en ligne</h3>
              <p className="text-white/70 mb-8 leading-relaxed">
                Gérez votre stock, recevez des commandes et développez votre clientèle au Burkina Faso.
              </p>
              <Link to="/register" className="inline-flex items-center gap-2 bg-white text-gold-700 font-semibold px-6 py-3 rounded-xl hover:bg-gold-50 transition-colors btn">
                Ouvrir ma boutique <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAIEMENTS ────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-forest-600 font-semibold text-sm uppercase tracking-widest font-display mb-3">Paiements adaptés</p>
          <h3 className="section-title text-3xl mb-12">Méthodes de paiement au Burkina</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PAYMENTS.map(({ logo, emoji, name, sub }) => (
              <div key={name} className="card-hover flex flex-col items-center gap-4 py-8">
                <div className="h-12 flex items-center justify-center">
                  {logo
                    ? <img src={logo} alt={name} className="h-12 w-auto object-contain" />
                    : <span className="text-4xl">{emoji}</span>
                  }
                </div>
                <div className="text-center">
                  <p className="font-display font-semibold text-stone-900 text-sm">{name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="bg-forest-950 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-forest rounded-xl flex items-center justify-center shadow-forest/30 shadow-md">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-display font-bold text-xl">
                  <span className="text-white">Market</span><span className="text-gold-400">BF</span>
                </div>
                <div className="text-xs text-white/40">🇧🇫 La Marketplace du Burkina Faso</div>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-white/50">© {new Date().getFullYear()} Market BF · Ouagadougou, Burkina Faso</p>
              <p className="text-xs text-white/30 mt-1">Développé pour les commerçants burkinabè</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
