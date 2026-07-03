import BackofficeLayout from '../backoffice/BackofficeLayout'
import { LayoutDashboard, Store, Users, ShieldCheck } from 'lucide-react'

const NAV = [
  {
    section: 'Pilotage',
    items: [
      { to: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Gestion',
    items: [
      { to: '/admin/shops', label: 'Boutiques', icon: Store },
      { to: '/admin/users', label: 'Utilisateurs', icon: Users },
    ],
  },
]

const PAGE_TITLES = {
  '/admin/dashboard': 'Tableau de bord',
  '/admin/shops': 'Gestion des boutiques',
  '/admin/users': 'Gestion des utilisateurs',
}

export default function AdminLayout(props) {
  return (
    <BackofficeLayout
      nav={NAV}
      tagline="Administration"
      roleLabel="Administrateur"
      breadcrumbRoot="Administration"
      pageTitles={PAGE_TITLES}
      avatarIcon={ShieldCheck}
      {...props}
    />
  )
}
