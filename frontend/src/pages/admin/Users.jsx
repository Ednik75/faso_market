import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../api/axios'
import { Users, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE = {
  admin:    { label: 'Admin',      cls: 'bg-stone-100 text-stone-700 border-stone-200',  avatar: 'bg-stone-900 text-white' },
  merchant: { label: 'Commerçant', cls: 'bg-blue-50 text-blue-700 border-blue-100',      avatar: 'bg-blue-100 text-blue-700' },
  client:   { label: 'Client',     cls: 'bg-forest-50 text-forest-700 border-forest-100', avatar: 'bg-forest-100 text-forest-700' },
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id, name) => {
    if (!confirm(`Supprimer définitivement le compte « ${name} » ?\nSes boutiques, produits et commandes associées seront également supprimés. Cette action est irréversible.`)) return
    setDeleting(id)
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers(u => u.filter(x => x.id !== id))
      toast.success('Utilisateur supprimé')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally { setDeleting(null) }
  }

  const filtered = users.filter(u =>
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase())) &&
    (!roleFilter || u.role === roleFilter)
  )

  return (
    <AdminLayout subtitle={`${users.length} compte${users.length > 1 ? 's' : ''} enregistré${users.length > 1 ? 's' : ''} sur la plateforme`}>

      {/* Barre d'outils */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-colors"
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-colors sm:w-48"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">Tous les rôles</option>
          <option value="client">Clients</option>
          <option value="merchant">Commerçants</option>
          <option value="admin">Administrateurs</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-stone-50 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-8 h-8 text-stone-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-stone-600">Aucun utilisateur trouvé</p>
            <p className="text-xs text-stone-400 mt-0.5">Modifiez vos critères de recherche.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70">
                  {['Utilisateur', 'Contact', 'Rôle', 'Inscrit le', ''].map((h, i) => (
                    <th key={i} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-500 text-left ${i === 4 ? 'w-14' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map(u => {
                  const r = ROLE[u.role] || ROLE.client
                  return (
                    <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${r.avatar}`}>
                            <span className="text-xs font-bold">{u.name[0]?.toUpperCase()}</span>
                          </div>
                          <span className="font-semibold text-stone-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-stone-700">{u.email}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{u.phone || 'Téléphone non renseigné'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-md border ${r.cls}`}>
                          {r.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500 tabular-nums whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            disabled={deleting === u.id}
                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title={`Supprimer ${u.name}`}
                            aria-label={`Supprimer ${u.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
