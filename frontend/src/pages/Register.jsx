import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Store, User, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import GoogleSignIn from '../components/GoogleSignIn'

const ROLES = [
  { value: 'client',   label: 'Client',      desc: 'J\'achète des produits',   emoji: '🛒', benefits: ['Recherche de boutiques', 'Commandes en ligne', 'Paiement mobile'] },
  { value: 'merchant', label: 'Commerçant',  desc: 'Je vends mes produits',    emoji: '🏪', benefits: ['Gestion de stock', 'Réception de commandes', 'Statistiques de ventes'] },
]

export default function Register() {
  const { register } = useAuth()
  const navigate      = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'client', phone: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Mot de passe trop court (8 caractères min.)'); return }
    if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      toast.error('Le mot de passe doit contenir au moins une lettre et un chiffre'); return
    }
    setLoading(true)
    try {
      const user = await register(form)
      toast.success(`Bienvenue sur Market BF, ${user.name.split(' ')[0]} ! 🎉`)
      navigate(`/${user.role}/dashboard`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la création du compte')
    } finally { setLoading(false) }
  }

  const selected = ROLES.find(r => r.value === form.role)

  return (
    <div className="min-h-screen flex">

      {/* Panneau gauche */}
      <div className="hidden lg:flex w-[46%] bg-gradient-dark bg-pattern-geo flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-forest-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <Link to="/" className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl">
            <span className="text-white">Market</span><span className="text-gold-400">BF</span>
          </span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-display font-black text-4xl text-white leading-tight mb-6">
            Rejoignez<br />
            <span className="text-gradient-gold">Market BF</span>
          </h2>

          {/* Bénéfices dynamiques selon rôle */}
          <div className="card-glass !p-6 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{selected?.emoji}</span>
              <div>
                <p className="font-display font-bold text-white">{selected?.label}</p>
                <p className="text-white/50 text-sm">{selected?.desc}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {selected?.benefits.map(b => (
                <li key={b} className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle2 className="w-4 h-4 text-forest-400 shrink-0" />{b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-xs">© 2025 Market BF · Ouagadougou 🇧🇫</p>
      </div>

      {/* Panneau droit */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-sand-50 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-up">

          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-forest rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl">
              <span className="text-forest-700">Market</span><span className="text-gold-500">BF</span>
            </span>
          </Link>

          <h1 className="font-display font-bold text-3xl text-stone-900 mb-1">Créer un compte</h1>
          <p className="text-stone-500 mb-8">Gratuit et rapide — moins de 2 minutes</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ROLES.map(({ value, label, desc, emoji }) => (
              <button key={value} type="button" onClick={() => upd('role', value)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  form.role === value
                    ? 'border-forest-500 bg-forest-50 shadow-forest/20 shadow-md'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}>
                <span className="text-2xl block mb-2">{emoji}</span>
                <p className={`font-display font-semibold text-sm ${form.role === value ? 'text-forest-700' : 'text-stone-800'}`}>{label}</p>
                <p className="text-xs text-stone-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          <div className="card !shadow-glass-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label">Nom complet</label>
                <input className="input" type="text" placeholder="Traore Aminata"
                  value={form.name} onChange={e => upd('name', e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Email</label>
                <input className="input" type="email" placeholder="votre@email.com"
                  value={form.email} onChange={e => upd('email', e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Téléphone Burkina <span className="text-stone-400">(+226)</span></label>
                <input className="input" type="tel" placeholder="+226 70 00 00 00"
                  value={form.phone} onChange={e => upd('phone', e.target.value)} />
              </div>
              <div>
                <label className="field-label">Mot de passe</label>
                <div className="relative">
                  <input className="input pr-11" type={showPwd ? 'text' : 'password'} placeholder="8 caractères min., lettres et chiffres"
                    value={form.password} onChange={e => upd('password', e.target.value)} required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Barre de force mot de passe */}
              {form.password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        form.password.length >= i * 2
                          ? i <= 2 ? 'bg-crimson-400' : i === 3 ? 'bg-gold-400' : 'bg-forest-500'
                          : 'bg-stone-100'
                      }`} />
                    ))}
                  </div>
                  <p className="text-[10px] text-stone-400">
                    {form.password.length < 6 ? 'Trop court' : form.password.length < 8 ? 'Faible' : (/[a-zA-Z]/.test(form.password) && /[0-9]/.test(form.password)) ? 'Fort ✓' : 'Ajoutez lettres et chiffres'}
                  </p>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 mt-2">
                {loading ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Création…</span>
                ) : (
                  <span className="flex items-center gap-2">Créer mon compte <ArrowRight className="w-4 h-4" /></span>
                )}
              </button>
            </form>

            <GoogleSignIn role={form.role} />
          </div>

          <p className="text-center text-sm text-stone-500 mt-6">
            Déjà inscrit ?{' '}
            <Link to="/login" className="text-forest-600 font-semibold hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
