import { useState, useEffect } from 'react'
import MerchantLayout from '../../components/merchant/MerchantLayout'
import api from '../../api/axios'
import { Store, MapPin, Save, Plus, CheckCircle2, Clock, XCircle, Info, LocateFixed, Loader2 } from 'lucide-react'
import { getCurrentPosition, BF_CITIES, OUAGA_QUARTIERS } from '../../utils/geo'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Alimentation',
  'Céréales & Légumineuses',
  'Mode & Vêtements',
  'Pagnes & Tissus',
  'Santé & Beauté',
  'Produits naturels',
  'Électronique',
  'Maison & Décoration',
  'Agriculture & Élevage',
  'Artisanat burkinabè',
  'Général',
]

const STATUS_CONFIG = {
  active:   { icon: CheckCircle2, label: 'Boutique active', desc: 'Votre boutique est visible par les clients sur Market BF.', cls: 'bg-forest-50 border-forest-200 text-forest-800', ic: 'text-forest-600' },
  pending:  { icon: Clock,        label: 'En attente de validation', desc: 'Un administrateur examine votre demande. Vous serez notifié dès l\'activation.', cls: 'bg-amber-50 border-amber-200 text-amber-900', ic: 'text-amber-600' },
  rejected: { icon: XCircle,      label: 'Boutique rejetée', desc: 'Contactez le support Market BF pour en connaître la raison.', cls: 'bg-red-50 border-red-200 text-red-800', ic: 'text-red-600' },
}

export default function ShopProfile() {
  const [shop, setShop] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    latitude: 12.3647,
    longitude: -1.5337,
    category: 'Général',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const useMyPosition = async () => {
    setLocating(true)
    try {
      const pos = await getCurrentPosition()
      setForm(f => ({ ...f, latitude: pos.latitude, longitude: pos.longitude }))
      toast.success('Coordonnées GPS de la boutique mises à jour ! 📍')
    } catch (err) {
      toast.error(err.message)
    } finally { setLocating(false) }
  }

  useEffect(() => {
    api.get('/shops/merchant/mine')
      .then(({ data }) => {
        setShop(data)
        setForm({
          name: data.name,
          description: data.description || '',
          address: data.address || '',
          latitude: data.latitude,
          longitude: data.longitude,
          category: data.category,
        })
      })
      .catch(() => setShop(null))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) { toast.error('Le nom est requis'); return }
    setSaving(true)
    try {
      if (shop) {
        await api.put(`/shops/${shop.id}`, form)
        toast.success('Boutique mise à jour')
      } else {
        const { data } = await api.post('/shops', form)
        setShop(data)
        toast.success('Boutique créée ! En attente de validation.')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally { setSaving(false) }
  }

  const statusCfg = shop ? STATUS_CONFIG[shop.status] : null

  return (
    <MerchantLayout
      title={shop ? 'Ma boutique' : 'Créer ma boutique'}
      subtitle={shop ? 'Informations publiques de votre boutique' : 'Renseignez les informations de votre commerce'}
    >
      {loading ? (
        <div className="bg-white border border-stone-200 rounded-xl h-72 animate-pulse" />
      ) : (
        <div className="max-w-2xl">

          {/* Bandeau de statut */}
          {shop && statusCfg && (
            <div className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border mb-5 ${statusCfg.cls}`}>
              <statusCfg.icon className={`w-4 h-4 mt-0.5 shrink-0 ${statusCfg.ic}`} />
              <div>
                <p className="text-sm font-semibold">{statusCfg.label}</p>
                <p className="text-xs opacity-80 mt-0.5">{statusCfg.desc}</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="field-label">Nom de la boutique *</label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    className="input pl-10"
                    placeholder="Ex: Épicerie Wend-Kuni"
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Description de votre commerce</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Décrivez vos produits, votre spécialité, vos horaires…"
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                />
              </div>

              <div>
                <label className="field-label">Catégorie</label>
                <select className="input" value={form.category} onChange={e => update('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="field-label">Adresse de la boutique (ville, quartier, repère)</label>
                <div className="relative mb-2">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    className="input pl-10"
                    placeholder="Ex: Accart-Ville, Bobo-Dioulasso — ou Secteur 15, Hamdallaye, Ouagadougou"
                    value={form.address}
                    onChange={e => update('address', e.target.value)}
                  />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-1.5">Ouagadougou</p>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {OUAGA_QUARTIERS.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => update('address', `${q}, Ouagadougou`)}
                      className="text-xs bg-stone-100 hover:bg-forest-50 text-stone-600 hover:text-forest-700 px-2.5 py-1 rounded-md transition-colors font-medium border border-transparent hover:border-forest-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-1.5">Autres villes du Burkina</p>
                <div className="flex flex-wrap gap-1.5">
                  {BF_CITIES.filter(c => c !== 'Ouagadougou').map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => update('address', c)}
                      className="text-xs bg-stone-100 hover:bg-forest-50 text-stone-600 hover:text-forest-700 px-2.5 py-1 rounded-md transition-colors font-medium border border-transparent hover:border-forest-200"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="field-label !mb-0">Position GPS de la boutique</label>
                  <button
                    type="button"
                    onClick={useMyPosition}
                    disabled={locating}
                    className="flex items-center gap-1.5 text-xs font-semibold text-forest-700 hover:text-forest-800 bg-forest-50 hover:bg-forest-100 border border-forest-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
                  >
                    {locating
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Localisation…</>
                      : <><LocateFixed className="w-3.5 h-3.5" /> Utiliser ma position actuelle</>
                    }
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Latitude</label>
                    <input
                      className="input"
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={e => update('latitude', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Longitude</label>
                    <input
                      className="input"
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={e => update('longitude', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Aide GPS */}
              <div className="flex items-start gap-3 bg-stone-50 border border-stone-200 rounded-lg px-4 py-3.5">
                <Info className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                <div className="text-xs text-stone-500 leading-relaxed">
                  <p className="font-semibold text-stone-700 mb-0.5">Position exacte = clients qui vous trouvent</p>
                  Le plus simple : cliquez sur <strong>« Utiliser ma position actuelle »</strong> depuis votre boutique.
                  Sinon, ouvrez Google Maps, appuyez longuement sur votre emplacement et copiez les coordonnées.
                  Votre boutique apparaîtra sur la carte, où que vous soyez au Burkina Faso.
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg px-4 py-3 transition-colors disabled:opacity-50"
              >
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sauvegarde…</>
                  : shop
                    ? <><Save className="w-4 h-4" /> Sauvegarder les modifications</>
                    : <><Plus className="w-4 h-4" /> Créer ma boutique</>
                }
              </button>
            </form>
          </div>
        </div>
      )}
    </MerchantLayout>
  )
}
