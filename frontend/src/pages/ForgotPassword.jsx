import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Store, KeyRound, MailCheck, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Une erreur est survenue, réessayez.')
    } finally { setLoading(false) }
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
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-5 bg-forest-50 rounded-full flex items-center justify-center">
                <MailCheck className="w-8 h-8 text-forest-600" />
              </div>
              <h1 className="font-display font-bold text-xl text-stone-900 mb-2">Vérifiez votre boîte mail</h1>
              <p className="text-sm text-stone-500 leading-relaxed mb-6">
                Si un compte existe avec <strong className="text-stone-700">{email}</strong>, vous recevrez
                un lien de réinitialisation dans quelques instants. Le lien est valable <strong>1 heure</strong>.
              </p>
              <p className="text-xs text-stone-400 mb-6">
                Rien reçu ? Vérifiez vos spams, ou{' '}
                <button onClick={() => setSent(false)} className="text-forest-600 font-semibold hover:underline">réessayez</button>.
              </p>
              <Link to="/login" className="btn-outline w-full justify-center">
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 mb-5 bg-gold-50 rounded-2xl flex items-center justify-center">
                <KeyRound className="w-7 h-7 text-gold-600" />
              </div>
              <h1 className="font-display font-bold text-2xl text-stone-900 mb-2">Mot de passe oublié ?</h1>
              <p className="text-sm text-stone-500 mb-6 leading-relaxed">
                Pas de panique. Entrez l'adresse email de votre compte et nous vous enverrons
                un lien pour choisir un nouveau mot de passe.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="field-label">Adresse email</label>
                  <input className="input" type="email" placeholder="votre@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Envoi…</span>
                  ) : 'Envoyer le lien de réinitialisation'}
                </button>
              </form>
              <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-stone-500 hover:text-forest-600 mt-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
