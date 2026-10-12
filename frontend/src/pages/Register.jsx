import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Store, ShoppingBag, Eye, EyeOff, ArrowRight, CheckCircle2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import GoogleSignIn from '../components/GoogleSignIn'
import Logo from '../components/Logo'
import BFFlag from '../components/BFFlag'

const ROLES = [
  { value: 'client',   label: 'Client',      desc: 'J\'achète des produits',   icon: ShoppingBag, benefits: ['Recherche de boutiques', 'Commandes en ligne', 'Paiement mobile'] },
  { value: 'merchant', label: 'Commerçant',  desc: 'Je vends mes produits',    icon: Store, benefits: ['Gestion de stock', 'Réception de commandes', 'Statistiques de ventes'] },
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
      toast.success(`Bienvenue sur Market BF, ${user.name.split(' ')[0]} !`)
      navigate(`/${user.role}/dashboard`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la création du compte')
    } finally { setLoading(false) }
  }

  const selected = ROLES.find(r => r.value === form.role)

  return (
    <div className="min-h-screen flex">

      {/* Panneau gauche */}
      <div className="hidden lg:flex w-[46%] section-hero flex-col justify-between p-10 xl:p-14">
        <div className="relative z-10">
          <Logo tone="light" />
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display font-medium text-4xl xl:text-5xl text-white leading-[1.05] tracking-tight mb-10">
            Rejoignez le marché <em className="text-accent-400 font-normal">en ligne</em> du Faso.
          </h2>

          {/* Bénéfices selon le rôle choisi */}
          <div key={selected?.value} className="border-t border-white/15 pt-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <span className="w-12 h-12 rounded-2xl bg-accent-400 text-ink-900 flex items-center justify-center">
                {selected && <selected.icon className="w-5 h-5" />}
              </span>
              <div>
                <p className="font-semibold text-white">{selected?.label}</p>
                <p className="text-white/50 text-sm">{selected?.desc}</p>
              </div>
            </div>
            <ul className="space-y-3">
              {selected?.benefits.map(b => (
                <li key={b} className="flex items-center gap-3 text-[15px] text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-accent-400 shrink-0" />{b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="relative z-10 text-white/30 text-xs flex items-center gap-2">
          © {new Date().getFullYear()} Market BF · Ouagadougou <BFFlag className="w-4 h-3" />
        </p>
      </div>

      {/* Panneau droit */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-paper-50 overflow-y-auto">
        <div className="w-full max-w-[420px] animate-fade-up">

          <Logo className="lg:hidden mb-10" />

          <h1 className="page-title mb-2">Créer un compte</h1>
          <p className="text-stone-500 mb-8">Gratuit et rapide — moins de 2 minutes</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ROLES.map(({ value, label, desc, icon: Icon }) => {
              const active = form.role === value
              return (
                <button key={value} type="button" onClick={() => upd('role', value)} aria-pressed={active}
                  className={`relative p-4 rounded-2xl border text-left transition-all ${
                    active
                      ? 'border-ink-900 bg-white ring-1 ring-ink-900'
                      : 'border-paper-300 hover:border-paper-400 bg-white/60'
                  }`}>
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                    active ? 'bg-brand-600 text-white' : 'bg-paper-100 text-ink-700'
                  }`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  {active && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-ink-900 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                  )}
                  <p className="font-semibold text-sm text-ink-900">{label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
                </button>
              )
            })}
          </div>

          <div className="card !shadow-soft-md">
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
                          ? i <= 2 ? 'bg-danger-400' : i === 3 ? 'bg-accent-400' : 'bg-brand-500'
                          : 'bg-stone-100'
                      }`} />
                    ))}
                  </div>
                  <p className="text-[10px] text-stone-400">
                    {form.password.length < 6 ? 'Trop court' : form.password.length < 8 ? 'Faible' : (/[a-zA-Z]/.test(form.password) && /[0-9]/.test(form.password)) ? 'Fort' : 'Ajoutez lettres et chiffres'}
                  </p>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary btn-lg w-full mt-2">
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
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
