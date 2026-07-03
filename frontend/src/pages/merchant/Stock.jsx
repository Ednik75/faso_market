import { useState, useEffect } from 'react'
import MerchantLayout from '../../components/merchant/MerchantLayout'
import { Panel, TableShell, EmptyState, ToolbarButton } from '../../components/backoffice/ui'
import api from '../../api/axios'
import { ArrowUp, ArrowDown, AlertTriangle, RefreshCw, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MerchantStock() {
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ type: 'entry', quantity: '', note: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/products/merchant/mine')
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const loadMovements = async (productId) => {
    try {
      const { data } = await api.get(`/stock/movements/${productId}`)
      setMovements(data)
    } catch { setMovements([]) }
  }

  const selectProduct = (p) => {
    setSelected(p)
    loadMovements(p.id)
  }

  const handleMovement = async (e) => {
    e.preventDefault()
    if (!selected || !form.quantity) return
    setSubmitting(true)
    try {
      await api.post('/stock/movement', {
        product_id: selected.id,
        type: form.type,
        quantity: parseInt(form.quantity),
        note: form.note || null,
      })
      toast.success('Mouvement enregistré')
      setForm({ type: 'entry', quantity: '', note: '' })
      load()
      loadMovements(selected.id)
      setSelected(s => s ? {
        ...s,
        stock_quantity: form.type === 'entry'
          ? (s.stock_quantity ?? 0) + parseInt(form.quantity)
          : (s.stock_quantity ?? 0) - parseInt(form.quantity),
      } : s)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally { setSubmitting(false) }
  }

  const lowCount = products.filter(p => (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 5)).length

  return (
    <MerchantLayout
      subtitle={`${products.length} référence${products.length > 1 ? 's' : ''} suivie${products.length > 1 ? 's' : ''}${lowCount > 0 ? ` · ${lowCount} en alerte` : ''}`}
      actions={<ToolbarButton onClick={load} icon={RefreshCw} spinning={loading}>Actualiser</ToolbarButton>}
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">

        {/* Inventaire */}
        <div className="xl:col-span-2 space-y-4">
          <Panel title="Inventaire des produits">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-stone-50 rounded-lg animate-pulse" />)}
              </div>
            ) : products.length === 0 ? (
              <EmptyState icon={Package} title="Aucun produit dans votre catalogue" hint="Ajoutez des produits pour suivre leur stock." />
            ) : (
              <TableShell headers={[
                { label: 'Produit' }, { label: 'Quantité', align: 'center' },
                { label: 'Seuil', align: 'center' }, { label: 'État' },
              ]}>
                {products.map(p => {
                  const isLow = (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 5)
                  const isSelected = selected?.id === p.id
                  return (
                    <tr
                      key={p.id}
                      onClick={() => selectProduct(p)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-forest-50/70' : 'hover:bg-stone-50/60'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${isSelected ? 'text-forest-800' : 'text-stone-900'}`}>
                          {p.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold tabular-nums ${isLow ? 'text-red-600' : 'text-stone-900'}`}>
                          {p.stock_quantity ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-stone-400 tabular-nums">{p.low_stock_threshold ?? 5}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md border ${
                          isLow ? 'bg-red-50 text-red-700 border-red-200' : 'bg-forest-50 text-forest-700 border-forest-200'
                        }`}>
                          {isLow && <AlertTriangle className="w-3 h-3" />}
                          {isLow ? 'Stock faible' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </TableShell>
            )}
          </Panel>

          {/* Historique des mouvements */}
          {selected && movements.length > 0 && (
            <Panel title={<>Historique — <span className="text-forest-700">{selected.name}</span></>}>
              <ul className="divide-y divide-stone-100 max-h-56 overflow-y-auto">
                {movements.map(m => (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-2.5">
                    <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
                      m.type === 'entry' ? 'bg-forest-50 border-forest-100' : 'bg-red-50 border-red-100'
                    }`}>
                      {m.type === 'entry'
                        ? <ArrowUp className="w-3.5 h-3.5 text-forest-600" />
                        : <ArrowDown className="w-3.5 h-3.5 text-red-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`font-semibold text-sm tabular-nums ${m.type === 'entry' ? 'text-forest-700' : 'text-red-600'}`}>
                        {m.type === 'entry' ? '+' : '−'}{m.quantity}
                      </span>
                      {m.note && <span className="text-xs text-stone-400 ml-2">{m.note}</span>}
                    </div>
                    <span className="text-xs text-stone-400 tabular-nums shrink-0">
                      {new Date(m.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        {/* Formulaire de mouvement */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 xl:sticky xl:top-20">
          {!selected ? (
            <div className="text-center py-10">
              <Package className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-stone-600 mb-0.5">Sélectionnez un produit</p>
              <p className="text-xs text-stone-400">Cliquez sur une ligne de l'inventaire pour enregistrer un mouvement.</p>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">Mouvement de stock</p>
                <h2 className="font-display font-bold text-stone-900 truncate">{selected.name}</h2>
              </div>
              <form onSubmit={handleMovement} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: 'entry' }))}
                    className={`py-2.5 rounded-lg border flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                      form.type === 'entry'
                        ? 'border-forest-500 bg-forest-50 text-forest-700'
                        : 'border-stone-200 text-stone-500 hover:border-stone-300'
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" /> Entrée
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: 'exit' }))}
                    className={`py-2.5 rounded-lg border flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                      form.type === 'exit'
                        ? 'border-red-400 bg-red-50 text-red-600'
                        : 'border-stone-200 text-stone-500 hover:border-stone-300'
                    }`}
                  >
                    <ArrowDown className="w-4 h-4" /> Sortie
                  </button>
                </div>

                <div>
                  <label className="field-label">Quantité</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    placeholder="0"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Note (optionnel)</label>
                  <input
                    className="input"
                    placeholder="Ex: Réapprovisionnement fournisseur"
                    value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  />
                </div>

                {/* Aperçu */}
                <div className="bg-stone-50 border border-stone-100 rounded-lg p-3.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Stock actuel</span>
                    <span className="font-semibold text-stone-900 tabular-nums">{selected.stock_quantity ?? 0}</span>
                  </div>
                  {form.quantity && (
                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-stone-200/60">
                      <span className="text-stone-400">Après mouvement</span>
                      <span className={`font-semibold tabular-nums ${form.type === 'entry' ? 'text-forest-700' : 'text-red-600'}`}>
                        {form.type === 'entry'
                          ? (selected.stock_quantity ?? 0) + parseInt(form.quantity || 0)
                          : (selected.stock_quantity ?? 0) - parseInt(form.quantity || 0)
                        }
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement…' : 'Enregistrer le mouvement'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </MerchantLayout>
  )
}
