import {
  Wheat, Bean, Droplet, CupSoda, Shirt, Footprints, Backpack, Scissors,
  Palette, Sparkles, Leaf, Sprout, Smartphone, Sofa, Store, Package,
  UtensilsCrossed, ShoppingBasket, Flame,
} from 'lucide-react'

/**
 * Icône vectorielle associée à une catégorie de produit ou de boutique.
 * Remplace les emojis : rendu net, cohérent et accessible partout.
 */
const ICONS = {
  'Alimentation':            ShoppingBasket,
  'Céréales':                Wheat,
  'Céréales & Légumineuses': Wheat,
  'Légumineuses':            Bean,
  'Huiles':                  Droplet,
  'Épices & Condiments':     Flame,
  'Boissons':                CupSoda,
  'Mode & Vêtements':        Shirt,
  'Boubous':                 Shirt,
  'Robes':                   Shirt,
  'Chaussures':              Footprints,
  'Accessoires':             Backpack,
  'Pagnes & Tissus':         Scissors,
  'Artisanat burkinabè':     Palette,
  'Santé & Beauté':          Sparkles,
  'Corps & Beauté':          Sparkles,
  'Produits naturels':       Leaf,
  'Agriculture & Élevage':   Sprout,
  'Électronique':            Smartphone,
  'Maison & Décoration':     Sofa,
  'Restauration':            UtensilsCrossed,
  'Général':                 Store,
}

export function getCategoryIcon(category) {
  return ICONS[category] || Package
}

export default function CategoryIcon({ category, className = 'w-5 h-5', strokeWidth = 1.75 }) {
  const Icon = getCategoryIcon(category)
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />
}
