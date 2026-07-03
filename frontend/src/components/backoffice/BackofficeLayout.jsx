import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Store, LogOut, Menu, X, ExternalLink, ChevronRight } from 'lucide-react'

/**
 * Layout back-office partagé (admin + commerçant) :
 * sidebar sombre fixe, topbar avec fil d'ariane, zone de contenu.
 */
function SidebarContent({ nav, tagline, avatarIcon: AvatarIcon, pathname, onNavigate, onLogout, user }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06] shrink-0">
        <div className="w-8 h-8 bg-forest-600 rounded-lg flex items-center justify-center">
          <Store className="w-4 h-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-display font-bold text-[15px] text-white">
            Market<span className="text-gold-400">BF</span>
          </p>
          <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-stone-500">{tagline}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {nav.map(({ section, items }) => (
          <div key={section}>
            <p className="px-3 mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase text-stone-500">
              {section}
            </p>
            <div className="space-y-0.5">
              {items.map(({ to, label, icon: Icon }) => {
                const active = pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onNavigate}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-white/[0.08] text-white font-semibold'
                        : 'text-stone-400 hover:text-white hover:bg-white/[0.04] font-medium'
                    }`}
                  >
                    <span className={`w-0.5 h-4 rounded-full -ml-3 mr-0.5 transition-colors ${active ? 'bg-forest-400' : 'bg-transparent'}`} />
                    <Icon className={`w-[18px] h-[18px] ${active ? 'text-forest-400' : 'text-stone-500 group-hover:text-stone-300'}`} />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Lien vers le site public */}
      <div className="px-3 pb-3">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-400 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <ExternalLink className="w-[18px] h-[18px] text-stone-500" />
          Voir le site
        </Link>
      </div>

      {/* Profil + déconnexion */}
      <div className="border-t border-white/[0.06] p-3 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-lg bg-forest-600/20 border border-forest-500/30 flex items-center justify-center shrink-0">
            <AvatarIcon className="w-[18px] h-[18px] text-forest-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-stone-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            title="Déconnexion"
            className="p-2 rounded-lg text-stone-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BackofficeLayout({
  nav, tagline, roleLabel, breadcrumbRoot, pageTitles, avatarIcon,
  title, subtitle, actions, children,
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const pageTitle = title || pageTitles[pathname] || breadcrumbRoot

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const sidebarProps = {
    nav, tagline, avatarIcon,
    pathname, onLogout: handleLogout, user,
  }

  return (
    <div className="min-h-screen bg-stone-100">

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-stone-900 flex-col z-40">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-stone-900 flex flex-col animate-slide-right shadow-2xl">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/[0.06] z-10"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent {...sidebarProps} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* Zone principale */}
      <div className="lg:pl-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-stone-200 flex items-center gap-4 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Fil d'ariane */}
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-stone-400 hidden sm:inline">{breadcrumbRoot}</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-300 hidden sm:inline" />
            <span className="font-semibold text-stone-900 truncate">{pageTitle}</span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <span className="hidden md:block text-xs text-stone-400 capitalize">{today}</span>
            <div className="flex items-center gap-2 pl-4 border-l border-stone-200">
              <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-xs font-semibold text-stone-900">{user?.name?.split(' ')[0]}</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-wide">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px] w-full mx-auto">
          {(subtitle || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <h1 className="font-display font-bold text-xl text-stone-900">{pageTitle}</h1>
                {subtitle && <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
