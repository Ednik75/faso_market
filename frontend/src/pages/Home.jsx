import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Logo from '../components/Logo'
import BFFlag from '../components/BFFlag'
import CategoryIcon from '../components/CategoryIcon'
import api from '../api/axios'
import {
  Store, Search, MapPin, ShoppingBag, TrendingUp, ShieldCheck, Smartphone,
  ArrowRight, ArrowUpRight, Package, HandCoins, CheckCircle2, Clock, Navigation,
  Wheat, Droplet, Leaf, Bean, Scissors, Shirt, Footprints, Sprout,
} from 'lucide-react'

const FEATURES = [
  { icon: Search,      title: 'Recherche intelligente', desc: 'Trouvez mil, karité, bogolan ou pagne bazin dans toutes les boutiques de Ouagadougou.' },
  { icon: MapPin,      title: 'Carte interactive',      desc: 'Boutiques géolocalisées dans tous les secteurs : Hamdallaye, Ouaga 2000, Zogona…' },
  { icon: ShoppingBag, title: 'Commande en ligne',      desc: 'Payez via Orange Money, Moov Money, Wave ou à la livraison.' },
  { icon: TrendingUp,  title: 'Gestion des stocks',     desc: 'Alertes automatiques quand le stock baisse. Votre inventaire en temps réel.' },
  { icon: ShieldCheck, title: 'Paiements sécurisés',    desc: 'Transactions protégées, adaptées au marché burkinabè. Aucune carte bancaire requise.' },
  { icon: Smartphone,  title: 'Pensé pour le mobile',   desc: 'Une interface légère, rapide même sur réseau 3G.' },
]

const PAYMENTS = [
  { logo: '/orange.png', name: 'Orange Money' },
  { logo: '/moov.png',   name: 'Moov Money' },
  { logo: '/wave.png',   name: 'Wave' },
  { icon: HandCoins,     name: 'À la livraison' },
]

const TICKER = [
  { icon: Wheat,      label: 'Mil & Sorgho' },
  { icon: Droplet,    label: 'Beurre de karité' },
  { icon: Leaf,       label: 'Soumbala' },
  { icon: Bean,       label: 'Niébé' },
  { icon: Scissors,   label: 'Bogolan' },
  { icon: Shirt,      label: 'Pagne Faso Dan Fani' },
  { icon: Footprints, label: 'Sandales en cuir' },
  { icon: Droplet,    label: 'Huile de coton' },
  { icon: Wheat,      label: 'Fonio bio' },
  { icon: Shirt,      label: 'Boubou brodé' },
  { icon: Sprout,     label: 'Produits naturels' },
]

const STEPS = [
  { n: '01', title: 'Cherchez',    desc: 'Un produit, une boutique ou un quartier.' },
  { n: '02', title: 'Comparez',    desc: 'Prix, stock en temps réel, avis et distance.' },
  { n: '03', title: 'Commandez',   desc: 'Payez par mobile money ou à la livraison.' },
]

function HeroVisual() {
  return (
    <div className="relative">
      <div className="section-hero rounded-xl4 p-6 sm:p-8 text-white shadow-soft-lg">
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 font-semibold">Commande</p>
              <p className="font-display text-xl mt-1">N° MBF-000128</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-400/15 text-emerald-300 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Prête
            </span>
          </div>

          <ul className="divide-y divide-white/10 border-y border-white/10">
            {[
              { cat: 'Céréales', name: 'Mil local — sac 5 kg', qty: 1, price: 3500 },
              { cat: 'Huiles', name: 'Beurre de karité pur', qty: 2, price: 2500 },
              { cat: 'Pagnes & Tissus', name: 'Faso Dan Fani — 2 pagnes', qty: 1, price: 12000 },
            ].map(i => (
              <li key={i.name} className="flex items-center gap-3 py-3.5">
                <span className="w-10 h-10 rounded-xl bg-white/[0.07] border border-white/10 flex items-center justify-center text-accent-300 shrink-0">
                  <CategoryIcon category={i.cat} className="w-[18px] h-[18px]" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{i.name}</span>
                  <span className="block text-xs text-white/45">Qté {i.qty}</span>
                </span>
                <span className="text-sm tabular-nums text-white/80">{(i.qty * i.price).toLocaleString('fr-FR')} F</span>
              </li>
            ))}
          </ul>

          <div className="flex items-end justify-between mt-5">
            <div className="flex items-center gap-2 text-xs text-white/55">
              <Navigation className="w-3.5 h-3.5 text-accent-400" /> Livraison · Ouaga 2000
            </div>
            <div className="text-right">
              <p className="text-[11px] text-white/45">Total</p>
              <p className="font-display text-2xl tabular-nums">20 500 <span className="text-sm text-white/50">FCFA</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Pastilles flottantes */}
      <div className="hidden sm:flex absolute -top-7 left-6 lg:-left-8 items-center gap-3 bg-white rounded-2xl shadow-soft-lg border border-paper-200 pl-2 pr-4 py-2">
        <img src="/orange.png" alt="" className="w-9 h-9 object-contain rounded-lg" />
        <div className="leading-tight">
          <p className="text-xs font-semibold text-ink-900">Paiement reçu</p>
          <p className="text-[11px] text-paper-600">Orange Money</p>
        </div>
        <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-1" />
      </div>
      <div className="hidden sm:flex absolute right-6 lg:-right-5 -bottom-6 items-center gap-2.5 bg-accent-400 text-ink-900 rounded-2xl shadow-soft-lg px-4 py-3">
        <Clock className="w-4 h-4" />
        <p className="text-xs font-semibold">Prête en 25 min</p>
      </div>
    </div>
  )
}

function ProductTile({ product }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <Link to="/login" className="group block">
      <div className="relative aspect-[4/5] rounded-xl3 overflow-hidden bg-paper-100 border border-paper-200 mb-3">
        {product.image_url && !imgErr ? (
          <img src={product.image_url} alt={product.name} loading="lazy" onError={() => setImgErr(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-paper-400">
            <CategoryIcon category={product.category} className="w-12 h-12" strokeWidth={1.25} />
          </div>
        )}
        <span className="absolute top-3 left-3 bg-white/95 text-ink-800 text-[11px] font-semibold px-2.5 py-1 rounded-full">
          {product.category}
        </span>
        <span className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-ink-900 text-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
          <ArrowUpRight className="w-4 h-4" />
        </span>
      </div>
      <p className="font-medium text-ink-900 text-[15px] leading-snug line-clamp-1">{product.name}</p>
      <div className="flex items-center justify-between mt-1 gap-2">
        {product.shop_name && (
          <p className="text-xs text-paper-600 flex items-center gap-1 truncate">
            <Store className="w-3 h-3 shrink-0" /> {product.shop_name}
          </p>
        )}
        <p className="font-semibold text-ink-900 text-sm tabular-nums shrink-0">
          {product.price.toLocaleString('fr-FR')} <span className="text-xs font-medium text-paper-600">F</span>
        </p>
      </div>
    </Link>
  )
}

export default function Home() {
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    api.get('/products')
      .then(({ data }) => setProducts(data.slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [])

  return (
    <div className="min-h-screen bg-paper-50">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pt-10 pb-20 lg:pt-16 lg:pb-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-20 items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2.5 bg-white border border-paper-200 rounded-full pl-2 pr-4 py-1.5 text-[13px] font-medium text-ink-700 mb-8">
              <BFFlag />
              La marketplace du Burkina Faso
            </span>

            <h1 className="font-display font-medium text-[44px] leading-[1.02] sm:text-6xl lg:text-[76px] text-ink-900 tracking-[-0.02em]">
              Le marché de quartier,{' '}
              <em className="text-brand-600 font-normal">à portée</em> de main.
            </h1>

            <p className="text-lg text-paper-700 max-w-xl mt-7 leading-relaxed">
              Trouvez les boutiques proches de chez vous, vérifiez la disponibilité des produits en temps réel
              et commandez en quelques secondes.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-10">
              <Link to="/register" className="btn-primary btn-lg">
                Commencer gratuitement <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="btn-outline btn-lg">Se connecter</Link>
            </div>

            <div className="flex items-center gap-5 mt-12">
              <div className="flex -space-x-2">
                {PAYMENTS.filter(p => p.logo).map(p => (
                  <img key={p.name} src={p.logo} alt={p.name}
                    className="w-9 h-9 rounded-full bg-white border-2 border-paper-50 object-contain p-0.5" />
                ))}
              </div>
              <p className="text-sm text-paper-700 leading-snug">
                Orange Money, Moov Money, Wave<br className="hidden sm:block" /> ou paiement à la livraison
              </p>
            </div>
          </div>

          <div className="animate-fade-up lg:pl-6" style={{ animationDelay: '120ms' }}>
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ── BANDEAU PRODUITS ─────────────────────────────── */}
      <section className="border-y border-paper-200 bg-white py-5 overflow-hidden" aria-label="Produits phares">
        <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          {[0, 1].map(pass => (
            <div key={pass} className="flex gap-10 pr-10 shrink-0"
              style={{ animation: 'ticker 40s linear infinite' }}
              aria-hidden={pass === 1}>
              {TICKER.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2.5 text-[15px] font-medium text-ink-700 whitespace-nowrap">
                  <Icon className="w-4 h-4 text-brand-500" strokeWidth={1.75} />
                  {label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUITS ─────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="eyebrow mb-4">Catalogue en direct</p>
              <h2 className="section-title text-4xl md:text-5xl">Disponible maintenant</h2>
              <p className="text-paper-700 mt-3 max-w-lg">Commandez directement auprès des commerçants de Ouagadougou.</p>
            </div>
            <Link to="/register" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-900 border-b border-ink-900 pb-0.5 w-fit">
              Voir tout le catalogue <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i}>
                  <div className="aspect-[4/5] bg-paper-100 rounded-xl3 animate-pulse mb-3" />
                  <div className="h-4 w-3/4 bg-paper-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 card-muted">
              <Package className="w-10 h-10 mx-auto mb-3 text-paper-400" strokeWidth={1.5} />
              <p className="text-paper-700">Les produits apparaîtront ici.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
              {products.map(product => <ProductTile key={product.id} product={product} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-y border-paper-200">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.4fr] gap-16">
          <div>
            <p className="eyebrow mb-4">Pourquoi Market BF</p>
            <h2 className="section-title text-4xl md:text-5xl leading-[1.05]">
              Tout le commerce local, sur <em className="text-brand-600 font-normal">une seule</em> plateforme.
            </h2>
            <p className="text-paper-700 mt-5 text-lg leading-relaxed max-w-md">
              Commerçants et clients du Burkina Faso : des outils simples, conçus pour votre quotidien.
            </p>

            <ol className="mt-10 space-y-5">
              {STEPS.map(s => (
                <li key={s.n} className="flex gap-5">
                  <span className="font-display text-brand-600 text-lg tabular-nums w-8">{s.n}</span>
                  <div className="border-b border-paper-200 pb-5 flex-1">
                    <p className="font-semibold text-ink-900">{s.title}</p>
                    <p className="text-sm text-paper-700 mt-0.5">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid sm:grid-cols-2 gap-px bg-paper-200 border border-paper-200 rounded-xl3 overflow-hidden self-start">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-7 group hover:bg-paper-50 transition-colors">
                <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <h3 className="font-sans font-semibold text-ink-900 mb-1.5">{title}</h3>
                <p className="text-paper-700 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOUBLE APPEL À L'ACTION ──────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-5">
          <div className="section-hero rounded-xl4 p-10 lg:p-12 flex flex-col min-h-[340px]">
            <div className="relative flex flex-col flex-1">
              <ShoppingBag className="w-8 h-8 text-accent-400" strokeWidth={1.5} />
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 font-semibold mt-8">Pour les clients</p>
              <h3 className="font-display text-white text-3xl lg:text-4xl mt-2">Achetez local, simplement.</h3>
              <p className="text-white/60 mt-3 leading-relaxed max-w-sm">
                Découvrez les boutiques de Ouagadougou, commandez en ligne et payez avec Orange Money.
              </p>
              <Link to="/register" className="btn-accent btn-lg mt-auto w-fit">
                Créer un compte client <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-xl4 p-10 lg:p-12 flex flex-col min-h-[340px] bg-brand-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-weave opacity-60 pointer-events-none" />
            <div className="relative flex flex-col flex-1">
              <Store className="w-8 h-8 text-white" strokeWidth={1.5} />
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/60 font-semibold mt-8">Pour les commerçants</p>
              <h3 className="font-display text-white text-3xl lg:text-4xl mt-2">Vendez au-delà du quartier.</h3>
              <p className="text-white/75 mt-3 leading-relaxed max-w-sm">
                Gérez votre stock, recevez des commandes et développez votre clientèle au Burkina Faso.
              </p>
              <Link to="/register" className="btn-lg bg-white text-ink-900 hover:bg-paper-100 mt-auto w-fit">
                Ouvrir ma boutique <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAIEMENTS ────────────────────────────────────── */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto border-t border-paper-200 pt-14 grid lg:grid-cols-[1fr_2fr] gap-10 items-center">
          <div>
            <p className="eyebrow mb-3">Paiements adaptés</p>
            <h3 className="section-title text-3xl">Les moyens de paiement du Burkina.</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PAYMENTS.map(({ logo, icon: Icon, name }) => (
              <div key={name} className="card flex flex-col items-center gap-3 !py-7">
                <div className="h-11 flex items-center justify-center">
                  {logo
                    ? <img src={logo} alt="" className="h-11 w-auto object-contain" />
                    : <Icon className="w-9 h-9 text-brand-600" strokeWidth={1.5} />}
                </div>
                <p className="font-semibold text-ink-900 text-sm">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PIED DE PAGE ─────────────────────────────────── */}
      <footer className="bg-ink-900 text-white px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-[2fr_1fr_1fr] gap-10 pb-12 border-b border-white/10">
            <div>
              <Logo tone="light" />
              <p className="text-white/50 text-sm mt-5 max-w-sm leading-relaxed">
                La marketplace des commerçants et des clients du Burkina Faso.
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-semibold mb-4">Plateforme</p>
              <ul className="space-y-2.5 text-sm text-white/70">
                <li><Link to="/register" className="hover:text-white">Créer un compte</Link></li>
                <li><Link to="/login" className="hover:text-white">Se connecter</Link></li>
                <li><Link to="/register" className="hover:text-white">Ouvrir une boutique</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-semibold mb-4">Contact</p>
              <p className="text-sm text-white/70 flex items-center gap-2"><MapPin className="w-4 h-4 text-accent-400" /> Ouagadougou</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 text-xs text-white/40">
            <p>© {new Date().getFullYear()} Market BF · Ouagadougou, Burkina Faso</p>
            <p className="flex items-center gap-2"><BFFlag className="w-4 h-3" /> Conçu pour les commerçants burkinabè</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
