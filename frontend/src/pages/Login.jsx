import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Store, Eye, EyeOff, ArrowRight, ShieldCheck, Mail, Lock,
  AlertCircle, CheckCircle2, MapPin, ShoppingBag, TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import GoogleSignIn from '../components/GoogleSignIn'

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

      {/* ── Panneau gauche — décoratif ── */}
      <div className="hidden lg:flex w-[46%] section-hero flex-col justify-between p-10 xl:p-12">
        <div className="absolute top-24 right-16 w-72 h-72 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-16 left-8 w-80 h-80 bg-forest-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-3 w-fit group">
          <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/25 group-hover:bg-white/25 transition-colors">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-display font-bold text-xl text-white">Market</span>
            <span className="font-display font-bold text-xl text-gold-400">BF</span>
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-white/40">Burkina Faso</p>
          </div>
        </Link>

        {/* Contenu central */}
        <div className="relative z-10 max-w-md py-6">
          <span className="badge bg-gold-500/20 text-gold-300 mb-4">🇧🇫 La marketplace 100% burkinabè</span>
          <h2 className="font-display font-black text-4xl xl:text-[2.75rem] text-white leading-[1.08] mb-4">
            Le commerce local,<br />
            <span className="text-gradient-gold">digitalisé</span>
          </h2>
          <p className="text-white/60 text-[15px] leading-relaxed mb-6">
            Retrouvez vos boutiques de quartier, commandez en ligne et faites-vous livrer — de Ouagadougou à Bobo-Dioulasso.
          </p>

          {/* Points forts */}
          <ul className="space-y-2.5 mb-7">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-gold-300" />
                </div>
                <span className="text-sm text-white/70 leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>

          {/* Témoignage — masqué sur les écrans peu hauts pour éviter le défilement */}
          <div className="card-glass !p-4 [@media(max-height:780px)]:hidden">
            <div className="flex gap-1 mb-2" aria-hidden="true">
              {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-gold-400 text-xs">★</span>)}
            </div>
            <p className="text-white/80 text-[13px] italic leading-relaxed">
              « Market BF a transformé ma boutique ! Je reçois les commandes sur mon téléphone, avec la position GPS du client pour la livraison. »
            </p>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-400/30 flex items-center justify-center">
                <span className="text-gold-300 text-[10px] font-bold">OI</span>
              </div>
              <div>
                <p className="text-white/90 text-xs font-semibold">Ouédraogo Issouf</p>
                <p className="text-white/40 text-[11px]">Épicerie Wend-Kuni · Ouagadougou</p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          © {new Date().getFullYear()} Market BF · Ouagadougou, Burkina Faso
        </p>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 bg-sand-50">
        <div className="w-full max-w-md animate-fade-up">

          {/* Logo mobile */}
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8 w-fit">
            <div className="w-10 h-10 bg-gradient-forest rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl">
              <span className="text-forest-700">Market</span><span className="text-gold-500">BF</span>
            </span>
          </Link>

          <h1 className="font-display font-bold text-3xl text-stone-900 mb-1.5">Bon retour !</h1>
          <p className="text-stone-500 mb-6">Connectez-vous pour accéder à votre espace</p>

          <div className="card !shadow-glass-md">

            {/* Erreur en ligne */}
            {error && (
              <div className="flex items-start gap-2.5 bg-crimson-50 border border-crimson-200 rounded-xl px-4 py-3 mb-5 animate-fade-in" role="alert">
                <AlertCircle className="w-4 h-4 text-crimson-600 shrink-0 mt-0.5" />
                <div className="text-sm text-crimson-800 flex-1">
                  {error}
                  {error.toLowerCase().includes('incorrect') && (
                    <Link to="/forgot-password" className="block text-xs font-semibold text-crimson-700 hover:underline mt-1">
                      Mot de passe oublié ? Réinitialisez-le →
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
                  <Link to="/forgot-password" className="text-xs font-semibold text-forest-600 hover:text-forest-700 hover:underline">
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
                  <p className="flex items-center gap-1.5 text-xs text-gold-700 mt-1.5 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5" /> La touche Majuscule (Verr. Maj) est activée
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
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
              <ShieldCheck className="w-3.5 h-3.5 text-forest-500" /> Données chiffrées
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" /> Gratuit, sans engagement
            </span>
          </div>

          <p className="text-center text-sm text-stone-500 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-forest-600 font-semibold hover:underline">S'inscrire gratuitement</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
