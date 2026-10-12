/** Drapeau du Burkina Faso en SVG (remplace l'emoji drapeau, mal rendu sous Windows). */
export default function BFFlag({ className = 'w-5 h-3.5' }) {
  return (
    <svg viewBox="0 0 30 20" className={`${className} rounded-[2px] shrink-0`} role="img" aria-label="Burkina Faso">
      <rect width="30" height="10" fill="#EF2B2D" />
      <rect y="10" width="30" height="10" fill="#009E49" />
      <path
        fill="#FCD116"
        d="M15 6.2l.9 2.75h2.9l-2.35 1.7.9 2.75L15 11.7l-2.35 1.7.9-2.75-2.35-1.7h2.9z"
      />
    </svg>
  )
}
