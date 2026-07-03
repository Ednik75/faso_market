import { useState, useEffect } from 'react'
import MerchantLayout from '../../components/merchant/MerchantLayout'
import { KpiCard, Panel } from '../../components/backoffice/ui'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../api/axios'
import { TrendingUp, Package, ShoppingBag, Wallet, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-lg px-3.5 py-2.5 text-sm">
      <p className="font-semibold text-stone-800 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-stone-600 tabular-nums">
          {p.name} : <span className="font-semibold text-stone-900">{typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}</span>
          {p.name.toLowerCase().includes('revenu') ? ' FCFA' : ''}
        </p>
      ))}
    </div>
  )
}

export default function MerchantStatistics() {
  const [overview, setOverview] = useState(null)
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/stats/overview'),
      api.get('/stats/sales'),
      api.get('/stats/products'),
    ]).then(([ov, sl, tp]) => {
      setOverview(ov.data)
      setSales(sl.data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        revenue: Math.round(d.revenue),
      })))
      setProducts(tp.data.slice(0, 6))
    }).catch(() => toast.error('Erreur de chargement')).finally(() => setLoading(false))
  }, [])

  const kpis = [
    { label: 'Revenus totaux', value: overview ? `${(overview.total_revenue || 0).toLocaleString('fr-FR')} F` : '—', sub: 'Hors commandes annulées', icon: Wallet },
    { label: 'Commandes', value: overview?.total_orders ?? '—', sub: 'Depuis l\'ouverture', icon: ShoppingBag },
    { label: 'Produits actifs', value: overview?.product_count ?? '—', sub: 'Dans votre catalogue', icon: Package },
    { label: 'À traiter', value: overview?.pending_orders ?? '—', sub: 'Commandes en attente ou confirmées', icon: Clock },
  ]

  return (
    <MerchantLayout subtitle="Performance de votre boutique sur les 30 derniers jours">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map(k => <KpiCard key={k.label} {...k} loading={loading} />)}
      </div>

      {/* Revenus */}
      <div className="mb-4">
        <Panel title="Revenus journaliers — 30 derniers jours">
          <div className="p-5">
            {loading ? (
              <div className="h-60 bg-stone-50 rounded-lg animate-pulse" />
            ) : sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-stone-400">
                <TrendingUp className="w-8 h-8 mb-3 text-stone-300" />
                <p className="text-sm font-medium text-stone-600">Aucune donnée de ventes</p>
                <p className="text-xs mt-0.5">Vos revenus s'afficheront ici dès la première commande.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={sales} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a8a29e', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#a8a29e', fontFamily: 'Inter' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="revenue" name="Revenus"
                    stroke="#0d8259" strokeWidth={2} dot={{ r: 2.5, fill: '#0d8259', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#0d8259', stroke: '#d3f5e3', strokeWidth: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>

      {/* Top produits */}
      <Panel title="Produits les plus vendus">
        <div className="p-5">
          {loading ? (
            <div className="h-60 bg-stone-50 rounded-lg animate-pulse" />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-stone-400">
              <Package className="w-8 h-8 mb-3 text-stone-300" />
              <p className="text-sm font-medium text-stone-600">Aucune vente enregistrée</p>
              <p className="text-xs mt-0.5">Le classement apparaîtra après vos premières ventes.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={products} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#57534e', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="units_sold" name="Unités vendues" fill="#0d8259" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>
    </MerchantLayout>
  )
}
