import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

let gsiScriptPromise = null
function loadGsiScript() {
  if (gsiScriptPromise) return gsiScriptPromise
  gsiScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Impossible de charger Google Sign-In'))
    document.head.appendChild(script)
  })
  return gsiScriptPromise
}

/**
 * Bouton "Continuer avec Google".
 * Récupère le client ID depuis l'API ; si la connexion Google n'est pas
 * configurée côté serveur, affiche un bouton explicatif à la place.
 */
export default function GoogleSignIn({ role }) {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const btnRef = useRef(null)
  const roleRef = useRef(role)
  roleRef.current = role
  const [status, setStatus] = useState('loading') // loading | ready | unconfigured

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const { data } = await api.get('/auth/config')
        if (cancelled) return
        if (!data.googleClientId) { setStatus('unconfigured'); return }

        await loadGsiScript()
        if (cancelled || !btnRef.current) return

        window.google.accounts.id.initialize({
          client_id: data.googleClientId,
          callback: async (response) => {
            try {
              const user = await loginWithGoogle(response.credential, roleRef.current)
              toast.success(`Bienvenue, ${user.name.split(' ')[0]} !`)
              navigate(`/${user.role}/dashboard`)
            } catch (err) {
              toast.error(err.response?.data?.error || 'Échec de la connexion Google')
            }
          },
        })
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          locale: 'fr',
          width: 340,
        })
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('unconfigured')
      }
    }
    init()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 border-t border-stone-200" />
        <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">ou</span>
        <div className="flex-1 border-t border-stone-200" />
      </div>

      {status !== 'unconfigured' ? (
        <div className="flex justify-center min-h-[44px]" ref={btnRef} />
      ) : (
        <button
          type="button"
          onClick={() => toast('La connexion Google n\'est pas encore activée sur ce serveur.\nAjoutez GOOGLE_CLIENT_ID dans backend/.env', { icon: 'ℹ️', duration: 5000 })}
          className="w-full flex items-center justify-center gap-3 border border-stone-200 bg-white rounded-full py-3 text-sm font-semibold text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8L6.2 33c3.4 6.5 10 11 17.8 11z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41 35.4 44 30.1 44 24c0-1.3-.1-2.6-.4-3.9z"/>
          </svg>
          Continuer avec Google
        </button>
      )}
    </div>
  )
}
