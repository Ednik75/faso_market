import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange, max = 5, size = 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5'

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button key={star} type="button"
          onClick={() => onChange?.(star)}
          className={`transition-transform ${onChange ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}>
          <Star className={`${sz} transition-colors ${
            star <= value ? 'text-gold-500 fill-gold-500' : 'text-stone-200 fill-stone-200'
          }`} />
        </button>
      ))}
    </div>
  )
}
