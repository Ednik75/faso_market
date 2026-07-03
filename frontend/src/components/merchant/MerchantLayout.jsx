import BackofficeLayout from '../backoffice/BackofficeLayout'
import {
  LayoutDashboard, Package, Boxes, ClipboardList, BarChart2, Store,
} from 'lucide-react'

const NAV = [
  {
    section: 'Pilotage',
    items: [
      { to: '/merchant/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { to: '/merchant/statistics', label: 'Statistiques', icon: BarChart2 },
    ],
  },
  {
    section: 'Catalogue',
    items: [
      { to: '/merchant/products', label: 'Produits', icon: Package },
      { to: '/merchant/stock', label: 'Stock', icon: Boxes },
    ],
  },
  {
    section: 'Ventes',
    items: [
      { to: '/merchant/orders', label: 'Commandes', icon: ClipboardList },
    ],
  },
  {
    section: 'Boutique',
    items: [
      { to: '/merchant/profile', label: 'Ma boutique', icon: Store },
    ],
  },
]

const PAGE_TITLES = {
  '/merchant/dashboard': 'Tableau de bord',
  '/merchant/statistics': 'Statistiques de vente',
  '/merchant/products': 'Mes produits',
  '/merchant/stock': 'Gestion du stock',
  '/merchant/orders': 'Commandes reçues',
  '/merchant/profile': 'Ma boutique',
}

export default function MerchantLayout(props) {
  return (
    <BackofficeLayout
      nav={NAV}
      tagline="Espace commerçant"
      roleLabel="Commerçant"
      breadcrumbRoot="Espace commerçant"
      pageTitles={PAGE_TITLES}
      avatarIcon={Store}
      {...props}
    />
  )
}
