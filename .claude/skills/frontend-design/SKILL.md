---
name: frontend-design
description: Système de design de Market BF (palette « Latérite », typographies, composants Tailwind, règles d'icônes). À charger avant toute modification de l'interface du frontend (pages, composants, styles, icônes).
---

# Market BF — système de design « Latérite »

Direction artistique : éditoriale, chaleureuse et sobre, inspirée de la terre
latérite, du mil et du coton du Burkina Faso. Surfaces plates, contrastes nets,
pas d'effets « glassmorphism », pas de dégradés décoratifs ni d'animations en boucle.

## Règles absolues

1. **Aucun emoji dans l'interface ni dans les emails.** Toujours une icône vectorielle
   `lucide-react` (trait 1.75–2px). Les icônes de catégorie passent par
   `src/components/CategoryIcon.jsx`, le drapeau par `src/components/BFFlag.jsx`.
2. Les toasts `react-hot-toast` n'utilisent jamais `icon: '<emoji>'` : passer un
   élément lucide (`icon: <ShoppingCart className="w-4 h-4" />`) ou rien.
3. Pas de couleurs Tailwind brutes pour la marque : utiliser les jetons ci-dessous.

## Jetons (tailwind.config.js)

| Jeton      | Rôle                                           | Valeur clé |
|------------|------------------------------------------------|------------|
| `brand-*`  | Terre latérite — actions principales, liens    | `brand-600 #b8461f` |
| `accent-*` | Mil / safran — mises en avant, notes, prix promo | `accent-400 #f2b630` |
| `danger-*` | Erreurs, suppression                           | `danger-600 #c62f3c` |
| `paper-*`  | Fonds et neutres chauds                        | `paper-50 #fbf9f6` |
| `ink-*`    | Texte et surfaces sombres                      | `ink-900 #1c1917` |
| `success`  | Utiliser `emerald-*` de Tailwind               | |

## Typographie

- Titres : `font-display` → **Fraunces** (serif éditoriale), graisse 500–600,
  `tracking-tight`. Jamais `font-black`.
- Texte et interface : **DM Sans** (par défaut sur `body`).
- Sur-titres : classe `.eyebrow` (petites capitales espacées, couleur brand).

## Composants (src/index.css)

- Boutons : `.btn-primary`, `.btn-accent`, `.btn-outline`, `.btn-ghost`,
  `.btn-danger` + tailles `.btn-sm`, `.btn-lg`. Pleine couleur, rayon `rounded-full`.
- Cartes : `.card` (bordure fine `paper-200`, ombre `shadow-soft`), `.card-hover`.
- Champs : `.input`, `.field-label`. Badges : `.badge-brand|accent|red|gray|blue`.
- En-tête de page client : `.page-header` + `.eyebrow` + `h1.page-title`.
- Back-office : composants de `src/components/backoffice/ui.jsx`.

## Vérification

`cd frontend && npm run build` doit passer, puis contrôler qu'aucun emoji ne
subsiste :

```bash
python3 -c "import re,pathlib;p=re.compile('[\U0001F000-\U0001FAFF☀-➿]');[print(f) for f in pathlib.Path('frontend/src').rglob('*.jsx') if p.search(f.read_text())]"
```
