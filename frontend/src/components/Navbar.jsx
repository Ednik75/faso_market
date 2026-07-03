import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  ShoppingCart, Store, Menu, X, LogOut, User,
  LayoutDashboard, Package, Map, ClipboardList,
  BarChart2, Settings, Shield, Bell
} from 'lucide-react'

const clientLinks = [
  { to: '/client/dashboard', label: 'Accueil',    icon: LayoutDashboard },
  { to: '/client/catalog',   label: 'Produits',   icon: Package },
  { to: '/client/map',       label: 'Carte',      icon: Map },
  { to: '/client/orders',    label: 'Commandes',  icon: ClipboardList },
]
const merchantLinks = [
  { to: '/merchant/dashboard',   label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/merchant/products',    label: 'Produits',        icon: Package },
  { to: '/merchant/stock',       label: 'Stock',           icon: Store },
  { to: '/merchant/orders',      label: 'Commandes',       icon: ClipboardList },
  { to: '/merchant/statistics',  label: 'Statistiques',    icon: BarChart2 },
  { to: '/merchant/profile',     label: 'Ma boutique',     icon: Settings },
]
const adminLinks = [
  { to: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/admin/shops',     label: 'Boutiques',       icon: Store },
  { to: '/admin/users',     label: 'Utilisateurs',    icon: User },
]

export default function Navbar() {
  const { user, logout, cartCount } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => { logout(); navigate('/') }
  const links = user?.role === 'client' ? clientLinks
              : user?.role === 'merchant' ? merchantLinks
              : user?.role === 'admin'    ? adminLinks
              : []
  const isActive = (to) => location.pathname === to

  const roleColor = user?.role === 'admin'    ? 'bg-crimson-100 text-crimson-700'
                  : user?.role === 'merchant' ? 'bg-forest-100 text-forest-700'
                  : 'bg-gold-100 text-gold-700'

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-glass border-b border-white/60'
          : 'bg-white/70 backdrop-blur-md border-b border-stone-100/80'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-gradient-forest rounded-xl flex items-center justify-center shadow-forest/30 shadow-md group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className="leading-none">
                <span className="font-display font-bold text-xl text-forest-700">Market</span>
                <span className="font-display font-bold text-xl text-gold-500">BF</span>
                <div className="text-[10px] text-stone-400 font-medium tracking-widest">🇧🇫 BURKINA FASO</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {links.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive(to)
                      ? 'bg-forest-50 text-forest-700 font-semibold'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                  {isActive(to) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-forest-500 rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {user?.role === 'client' && (
                <Link to="/client/cart" className="relative p-2.5 rounded-xl hover:bg-stone-100 transition-colors">
                  <ShoppingCart className="w-5 h-5 text-stone-600" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-crimson-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-gold">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {user ? (
                <div className="hidden lg:flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${roleColor}`}>
                    {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" />
                      : user.role === 'merchant' ? <Store className="w-3.5 h-3.5" />
                      : <User className="w-3.5 h-3.5" />}
                    <span className="text-sm font-semibold font-display">{user.name.split(' ')[0]}</span>
                  </div>
                  <button onClick={handleLogout}
                    className="p-2.5 rounded-xl text-stone-400 hover:text-crimson-500 hover:bg-crimson-50 transition-colors"
                    title="Déconnexion">
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <Link to="/login"    className="btn-outline btn-sm">Connexion</Link>
                  <Link to="/register" className="btn-primary btn-sm">S'inscrire</Link>
                </div>
              )}

              <button className="lg:hidden p-2.5 rounded-xl hover:bg-stone-100 transition-colors" onClick={() => setOpen(!open)}>
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden border-t border-stone-100 bg-white/95 backdrop-blur-xl px-4 py-4 animate-fade-in">
            <div className="space-y-1 mb-4">
              {links.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(to) ? 'bg-forest-50 text-forest-700 font-semibold' : 'text-stone-700 hover:bg-stone-50'
                  }`}>
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}
            </div>
            <div className="divider pt-4">
              {user ? (
                <button onClick={() => { handleLogout(); setOpen(false) }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-sm text-crimson-600 font-medium hover:bg-crimson-50 rounded-xl transition-colors">
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/login"    onClick={() => setOpen(false)} className="btn-outline btn-sm flex-1 justify-center">Connexion</Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn-primary btn-sm flex-1 justify-center">S'inscrire</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
