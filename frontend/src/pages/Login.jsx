import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Eye, EyeOff, ArrowRight, ShieldCheck, Mail, Lock,
  AlertCircle, CheckCircle2, MapPin, ShoppingBag, TrendingUp, Star,
} from 'lucide-react'
import toast from 'react-hot-toast'
import GoogleSignIn from '../components/GoogleSignIn'
import Logo from '../components/Logo'
import BFFlag from '../components/BFFlag'

const FEATURES = [
  { icon: MapPin,      text: 'Boutiques géolocalisées partout au Burkina Faso' },
  { icon: ShoppingBag, text: 'Commandez en ligne, payez par Orange Money, Moov ou Wave' },
  { icon: TrendingUp,  text: 'Commerçants : stock, commandes et statistiques en temps réel' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPwd, setShowPwd]   = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const upd = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (error) setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Bienvenue, ${user.name.split(' ')[0]} !`)
      navigate(`/${user.role}/dashboard`)
    } catch (err) {
      setError(err.response?.data?.error || 'Connexion impossible. Vérifiez votre connexion internet et réessayez.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche — éditorial ── */}
      <div className="hidden lg:flex w-[46%] section-hero flex-col justify-between p-10 xl:p-14">
        <div className="relative z-10">
          <Logo tone="light" />
        </div>

        <div className="relative z-10 max-w-md py-6">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-300 mb-6">
            <BFFlag className="w-4 h-3" /> La marketplace 100 % burkinabè
          </span>
          <h2 className="font-display font-medium text-4xl xl:text-5xl text-white leading-[1.05] tracking-tight mb-5">
            Le commerce local, <em className="text-accent-400 font-normal">digitalisé.</em>
          </h2>
          <p className="text-white/60 text-[15px] leading-relaxed mb-8">
            Retrouvez vos boutiques de quartier, commandez en ligne et faites-vous livrer — de Ouagadougou à Bobo-Dioulasso.
          </p>

          <ul className="space-y-3 mb-10">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-accent-400 shrink-0 mt-0.5" strokeWidth={1.75} />
                <span className="text-sm text-white/75 leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>

          {/* Témoignage — masqué sur les écrans peu hauts */}
          <figure className="border-l-2 border-accent-400 pl-5 [@media(max-height:780px)]:hidden">
            <div className="flex gap-0.5 mb-3" aria-label="5 étoiles sur 5">
              {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3.5 h-3.5 text-accent-400 fill-accent-400" />)}
            </div>
            <blockquote className="font-display text-white/90 text-lg leading-snug">
              « Je reçois les commandes sur mon téléphone, avec la position GPS du client pour la livraison. »
            </blockquote>
            <figcaption className="mt-4 text-xs text-white/50">
              <span className="text-white/85 font-semibold">Ouédraogo Issouf</span> · Épicerie Wend-Kuni, Ouagadougou
            </figcaption>
          </figure>
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          © {new Date().getFullYear()} Market BF · Ouagadougou, Burkina Faso
        </p>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 bg-paper-50">
        <div className="w-full max-w-[420px] animate-fade-up">

          <Logo className="lg:hidden mb-10" />

          <h1 className="page-title mb-2">Bon retour.</h1>
          <p className="text-stone-500 mb-6">Connectez-vous pour accéder à votre espace</p>

          <div className="card !shadow-soft-md">

            {/* Erreur en ligne */}
            {error && (
              <div className="flex items-start gap-2.5 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3 mb-5 animate-fade-in" role="alert">
                <AlertCircle className="w-4 h-4 text-danger-600 shrink-0 mt-0.5" />
                <div className="text-sm text-danger-800 flex-1">
                  {error}
                  {error.toLowerCase().includes('incorrect') && (
                    <Link to="/forgot-password" className="block text-xs font-semibold text-danger-700 hover:underline mt-1">
                      <span className="inline-flex items-center gap-1">Mot de passe oublié ? Réinitialisez-le <ArrowRight className="w-3 h-3" /></span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="field-label">Adresse email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  <input
                    id="login-email"
                    className="input pl-10"
                    type="email"
                    placeholder="votre@email.com"
                    value={form.email}
                    onChange={e => upd('email', e.target.value)}
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="field-label !mb-0">Mot de passe</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  <input
                    id="login-password"
                    className="input pl-10 pr-11"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => upd('password', e.target.value)}
                    onKeyUp={e => setCapsLock(e.getModifierState?.('CapsLock') ?? false)}
                    onBlur={() => setCapsLock(false)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                    aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {capsLock && (
                  <p className="flex items-center gap-1.5 text-xs text-accent-700 mt-1.5 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5" /> La touche Majuscule (Verr. Maj) est activée
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connexion…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Se connecter <ArrowRight className="w-4 h-4" /></span>
                )}
              </button>
            </form>

            <GoogleSignIn />
          </div>

          {/* Réassurance */}
          <div className="flex items-center justify-center gap-5 mt-5 text-xs text-stone-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" /> Données chiffrées
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" /> Gratuit, sans engagement
            </span>
          </div>

          <p className="text-center text-sm text-stone-500 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">S'inscrire gratuitement</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
