import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  ShoppingBag, Store, Menu, X, LogOut, User,
  LayoutDashboard, Package, Navigation, ClipboardList,
  BarChart2, Settings, Shield,
} from 'lucide-react'
import Logo from './Logo'
import { PositionChip } from './LocationBar'

const clientLinks = [
  { to: '/client/dashboard', label: 'Près de moi', icon: Navigation },
  { to: '/client/catalog',   label: 'Produits',    icon: Package },
  { to: '/client/orders',    label: 'Commandes',   icon: ClipboardList },
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
  const [open, setOpen]         = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => { logout(); navigate('/') }
  const links = user?.role === 'client' ? clientLinks
              : user?.role === 'merchant' ? merchantLinks
              : user?.role === 'admin'    ? adminLinks
              : []
  const isActive = (to) => location.pathname === to
  const RoleIcon = user?.role === 'admin' ? Shield : user?.role === 'merchant' ? Store : User

  return (
    <nav className={`sticky top-0 z-50 transition-colors duration-200 ${
      scrolled ? 'bg-paper-50/95 backdrop-blur border-b border-paper-200' : 'bg-paper-50 border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px] gap-6">

          <Logo />

          {/* Navigation desktop */}
          <div className="hidden lg:flex items-center gap-1 mr-auto ml-6">
            {links.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'bg-ink-900 text-white'
                    : 'text-ink-700 hover:bg-paper-100'
                }`}>
                {label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {user?.role === 'client' && <PositionChip className="hidden md:inline-flex mr-1" />}
            {user?.role === 'client' && (
              <Link to="/client/cart" aria-label="Panier"
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-ink-700 hover:bg-paper-100 transition-colors">
                <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-paper-50">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="hidden lg:flex items-center gap-1.5 pl-2">
                <div className="flex items-center gap-2 pl-1 pr-3.5 py-1 rounded-full border border-paper-200 bg-white">
                  <span className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center">
                    <RoleIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-sm font-semibold text-ink-900">{user.name.split(' ')[0]}</span>
                </div>
                <button onClick={handleLogout} title="Déconnexion" aria-label="Déconnexion"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-paper-600 hover:text-danger-600 hover:bg-danger-50 transition-colors">
                  <LogOut className="w-[18px] h-[18px]" />
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link to="/login"    className="btn-sm text-ink-900 hover:bg-paper-100">Connexion</Link>
                <Link to="/register" className="btn-sm bg-ink-900 text-white hover:bg-ink-800">Créer un compte</Link>
              </div>
            )}

            <button className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-paper-100 transition-colors"
              onClick={() => setOpen(!open)} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}>
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="lg:hidden border-t border-paper-200 bg-paper-50 px-4 py-4 animate-fade-in">
          {user?.role === 'client' && <PositionChip className="md:hidden mb-3" />}
          <div className="space-y-1 mb-4">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive(to) ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-paper-100'
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
          </div>
          <div className="divider pt-4">
            {user ? (
              <button onClick={() => { handleLogout(); setOpen(false) }}
                className="flex items-center gap-3 px-4 py-3 w-full text-sm text-danger-600 font-medium hover:bg-danger-50 rounded-xl transition-colors">
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            ) : (
              <div className="flex gap-2">
                <Link to="/login"    onClick={() => setOpen(false)} className="btn-outline flex-1">Connexion</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-dark flex-1">Créer un compte</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
