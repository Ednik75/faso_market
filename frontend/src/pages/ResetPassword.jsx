import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Store, Eye, EyeOff, LockKeyhole, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const RULES = [
  { test: (p) => p.length >= 8, label: '8 caractères minimum' },
  { test: (p) => /[a-zA-Z]/.test(p), label: 'Au moins une lettre' },
  { test: (p) => /[0-9]/.test(p), label: 'Au moins un chiffre' },
]

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)

  const allValid = RULES.every(r => r.test(password))
  const match = password && password === confirm

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allValid) { toast.error('Le mot de passe ne respecte pas les critères'); return }
    if (!match)    { toast.error('Les deux mots de passe ne correspondent pas'); return }
    setLoading(true)
    try {
      await resetPassword(token, password)
      toast.success('Mot de passe réinitialisé ! Vous pouvez vous connecter. ✓')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lien invalide ou expiré')
    } finally { setLoading(false) }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-50 p-6">
        <div className="card !shadow-glass-md text-center max-w-md w-full animate-fade-up">
          <XCircle className="w-12 h-12 text-crimson-500 mx-auto mb-4" />
          <h1 className="font-display font-bold text-xl text-stone-900 mb-2">Lien invalide</h1>
          <p className="text-sm text-stone-500 mb-6">Ce lien de réinitialisation est incomplet ou a expiré.</p>
          <Link to="/forgot-password" className="btn-primary w-full justify-center">Refaire une demande</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 p-6">
      <div className="w-full max-w-md animate-fade-up">

        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-forest rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-2xl">
            <span className="text-forest-700">Market</span><span className="text-gold-500">BF</span>
          </span>
        </Link>

        <div className="card !shadow-glass-md">
          <div className="w-14 h-14 mb-5 bg-forest-50 rounded-2xl flex items-center justify-center">
            <LockKeyhole className="w-7 h-7 text-forest-600" />
          </div>
          <h1 className="font-display font-bold text-2xl text-stone-900 mb-2">Nouveau mot de passe</h1>
          <p className="text-sm text-stone-500 mb-6">Choisissez un mot de passe fort pour sécuriser votre compte.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="field-label">Nouveau mot de passe</label>
              <div className="relative">
                <input className="input pr-11" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {password.length > 0 && (
              <ul className="space-y-1.5">
                {RULES.map(({ test, label }) => {
                  const ok = test(password)
                  return (
                    <li key={label} className={`flex items-center gap-2 text-xs ${ok ? 'text-forest-600' : 'text-stone-400'}`}>
                      {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {label}
                    </li>
                  )
                })}
              </ul>
            )}

            <div>
              <label className="field-label">Confirmer le mot de passe</label>
              <input className="input" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                value={confirm} onChange={e => setConfirm(e.target.value)} required />
              {confirm.length > 0 && !match && (
                <p className="text-xs text-crimson-600 mt-1.5">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button type="submit" disabled={loading || !allValid || !match} className="btn-primary w-full justify-center py-3.5">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enregistrement…</span>
              ) : 'Réinitialiser mon mot de passe'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-500 mt-6">
          <Link to="/login" className="text-forest-600 font-semibold hover:underline">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  )
}
