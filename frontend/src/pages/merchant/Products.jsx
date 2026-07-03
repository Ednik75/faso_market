import { useState, useEffect, useRef } from 'react'
import MerchantLayout from '../../components/merchant/MerchantLayout'
import { TableShell, EmptyState, PrimaryButton } from '../../components/backoffice/ui'
import api from '../../api/axios'
import { Plus, Edit2, Trash2, Package, X, Upload, Link2, ImageIcon, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['Alimentation', 'Céréales', 'Huiles', 'Boissons', 'Mode & Vêtements', 'Robes', 'Chaussures', 'Accessoires', 'Électronique', 'Général']

function ImagePicker({ value, onChange }) {
  const [mode, setMode]           = useState(value?.startsWith('/uploads') ? 'file' : 'url')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState(value || '')
  const fileRef = useRef()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data } = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange(data.url)
      setPreview(data.url)
      toast.success('Image uploadée !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur upload')
      setPreview(value || '')
    } finally { setUploading(false) }
  }

  const handleUrl = (url) => {
    setPreview(url)
    onChange(url)
  }

  return (
    <div>
      <label className="field-label">Photo du produit</label>

      <div className="flex gap-1 p-1 bg-stone-100 rounded-lg mb-3">
        <button type="button" onClick={() => setMode('file')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
            mode === 'file' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}>
          <Upload className="w-3.5 h-3.5" /> Depuis la galerie
        </button>
        <button type="button" onClick={() => setMode('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
            mode === 'url' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}>
          <Link2 className="w-3.5 h-3.5" /> Par URL
        </button>
      </div>

      {mode === 'file' ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-stone-200 hover:border-forest-400 rounded-lg p-4 cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 bg-stone-50 hover:bg-forest-50"
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {uploading ? (
            <Loader2 className="w-7 h-7 text-forest-500 animate-spin" />
          ) : (
            <ImageIcon className="w-7 h-7 text-stone-300" />
          )}
          <p className="text-xs text-stone-500 text-center">
            {uploading ? 'Envoi en cours…' : 'Cliquez pour choisir une photo'}
          </p>
          <p className="text-[10px] text-stone-300">JPG, PNG, WEBP · max 5 Mo</p>
        </div>
      ) : (
        <input
          className="input"
          placeholder="https://exemple.com/image.jpg"
          value={mode === 'url' ? (value || '') : ''}
          onChange={e => handleUrl(e.target.value)}
        />
      )}

      {preview && (
        <div className="mt-3 relative">
          <img
            src={preview}
            alt="Aperçu"
            className="w-full h-36 object-cover rounded-lg border border-stone-200"
            onError={() => setPreview('')}
          />
          <button
            type="button"
            onClick={() => { setPreview(''); onChange('') }}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category || 'Général',
    image_url: product?.image_url || '',
    is_available: product?.is_available ?? 1,
  })
  const [loading, setLoading] = useState(false)
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price) { toast.error('Nom et prix requis'); return }
    setLoading(true)
    try {
      if (product) {
        await api.put(`/products/${product.id}`, { ...form, price: parseFloat(form.price) })
        toast.success('Produit modifié')
      } else {
        await api.post('/products', { ...form, price: parseFloat(form.price) })
        toast.success('Produit créé !')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-fade-up max-h-[90vh] overflow-y-auto border border-stone-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-display font-bold text-lg text-stone-900">
              {product ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
            <p className="text-stone-400 text-xs mt-0.5">
              {product ? 'Modifiez les informations' : 'Ajoutez un produit à votre catalogue'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors" aria-label="Fermer">
            <X className="w-4 h-4 text-stone-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="field-label">Nom du produit *</label>
            <input className="input" placeholder="Ex: Mil 5kg" value={form.name}
              onChange={e => update('name', e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Description</label>
            <textarea className="input" rows={2} placeholder="Qualité, origine, caractéristiques…"
              value={form.description} onChange={e => update('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Prix (FCFA) *</label>
              <input className="input" type="number" min="0" placeholder="0"
                value={form.price} onChange={e => update('price', e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Catégorie</label>
              <select className="input" value={form.category} onChange={e => update('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <ImagePicker value={form.image_url} onChange={v => update('image_url', v)} />

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
            <input
              type="checkbox"
              checked={form.is_available === 1}
              onChange={e => update('is_available', e.target.checked ? 1 : 0)}
              className="rounded w-4 h-4 accent-forest-600"
            />
            <div>
              <p className="text-sm font-semibold text-stone-800">Disponible à la vente</p>
              <p className="text-xs text-stone-400">Le produit sera visible par les clients</p>
            </div>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 text-sm font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-200 hover:border-stone-300 rounded-lg px-4 py-2.5 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sauvegarde…</>
                : 'Sauvegarder'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MerchantProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/products/merchant/mine')
      .then(({ data }) => setProducts(data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, name) => {
    if (!confirm(`Supprimer définitivement « ${name} » ?\nSon stock et son historique seront également supprimés.`)) return
    try {
      await api.delete(`/products/${id}`)
      toast.success('Produit supprimé')
      load()
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur') }
  }

  return (
    <MerchantLayout
      subtitle={`${products.length} produit${products.length > 1 ? 's' : ''} dans votre catalogue`}
      actions={
        <PrimaryButton onClick={() => setModal('add')} icon={Plus}>Ajouter un produit</PrimaryButton>
      }
    >
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-stone-50 rounded-lg animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-8 h-8 text-stone-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-stone-600 mb-1">Aucun produit</p>
            <p className="text-xs text-stone-400 mb-5">Commencez à remplir votre catalogue.</p>
            <div className="flex justify-center">
              <PrimaryButton onClick={() => setModal('add')} icon={Plus}>Ajouter mon premier produit</PrimaryButton>
            </div>
          </div>
        ) : (
          <TableShell headers={[
            { label: 'Produit' }, { label: 'Catégorie' }, { label: 'Prix', align: 'right' },
            { label: 'Stock', align: 'center' }, { label: 'Visibilité' }, { label: 'Actions', align: 'right' },
          ]}>
            {products.map(p => {
              const isLow = (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 5)
              return (
                <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-9 h-9 rounded-lg object-cover border border-stone-200 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-stone-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900">{p.name}</p>
                        {p.description && <p className="text-xs text-stone-400 truncate max-w-[260px] mt-0.5">{p.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-md font-medium">{p.category}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-stone-900 tabular-nums whitespace-nowrap">
                    {p.price.toLocaleString('fr-FR')} F
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-md border tabular-nums ${
                      isLow ? 'bg-red-50 text-red-700 border-red-200' : 'bg-forest-50 text-forest-700 border-forest-200'
                    }`}>
                      {p.stock_quantity ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md border ${
                      p.is_available
                        ? 'bg-forest-50 text-forest-700 border-forest-200'
                        : 'bg-stone-50 text-stone-500 border-stone-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.is_available ? 'bg-forest-500' : 'bg-stone-400'}`} />
                      {p.is_available ? 'En ligne' : 'Masqué'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModal(p)}
                        className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Modifier" aria-label={`Modifier ${p.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer" aria-label={`Supprimer ${p.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </TableShell>
        )}
      </div>

      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}
    </MerchantLayout>
  )
}
