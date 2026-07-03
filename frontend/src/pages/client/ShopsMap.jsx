import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import Navbar from '../../components/Navbar'
import ShopCard from '../../components/ShopCard'
import api from '../../api/axios'
import { MapPin, Store, Search, Navigation, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const shopIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

const userIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width:18px; height:18px;
    background:#2563eb; border:3px solid white;
    border-radius:50%; box-shadow:0 0 0 4px rgba(37,99,235,0.25);
  "></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
})

import { BURKINA_CENTER } from '../../utils/geo'

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDist(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

// Fly to a new center when userPos changes
function MapController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom ?? map.getZoom(), { duration: 1.2 })
  }, [center])
  return null
}

export default function ShopsMap() {
  const [shops, setShops]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [userPos, setUserPos]     = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [mapCenter, setMapCenter] = useState(null)

  useEffect(() => {
    api.get('/shops').then(({ data }) => setShops(data)).finally(() => setLoading(false))
  }, [])

  const locateMe = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude]
        setUserPos(coords)
        setMapCenter(coords)
        setGeoLoading(false)
        toast.success('Position trouvée ! Les boutiques sont triées par proximité.', { icon: '📍' })
      },
      (err) => {
        setGeoLoading(false)
        if (err.code === 1) {
          toast.error('Accès à la position refusé. Autorisez la géolocalisation dans votre navigateur.')
        } else {
          toast.error('Impossible d\'obtenir votre position. Réessayez.')
        }
      },
      { timeout: 12000, enableHighAccuracy: true }
    )
  }

  const filtered = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase()) ||
    (s.address || '').toLowerCase().includes(search.toLowerCase())
  )

  const shopsWithDist = filtered
    .map(s => ({
      ...s,
      distance: userPos ? haversine(userPos[0], userPos[1], s.latitude, s.longitude) : null,
    }))
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="page-container">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-stone-400 text-sm font-display mb-1">🗺️ Exploration</p>
            <h1 className="font-display font-black text-3xl text-stone-900">Carte des boutiques</h1>
            <p className="text-stone-400 text-sm mt-1">🇧🇫 Partout au Burkina Faso</p>
          </div>
          <button
            onClick={locateMe}
            disabled={geoLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shrink-0 mt-1 ${
              userPos
                ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                : 'btn-primary'
            }`}
          >
            {geoLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Navigation className="w-4 h-4" />
            }
            {geoLoading ? 'Localisation…' : userPos ? 'Ma position' : 'Me localiser'}
          </button>
        </div>

        {/* User position banner */}
        {userPos && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-700">
            <div className="w-3 h-3 bg-blue-600 rounded-full ring-2 ring-blue-300 shrink-0" />
            <span>
              Votre position est affichée sur la carte.
              Les boutiques sont triées par distance.
            </span>
            <button
              onClick={() => { setUserPos(null); setMapCenter(null) }}
              className="ml-auto text-blue-400 hover:text-blue-600 font-semibold text-xs"
            >
              Effacer
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            className="input pl-10"
            placeholder="Boutique, catégorie ou quartier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden shadow-glass border border-stone-200" style={{ height: '500px' }}>
              {!loading && (
                <MapContainer
                  {...(shops.length > 0
                    ? { bounds: L.latLngBounds(shops.map(s => [s.latitude, s.longitude])).pad(0.35), boundsOptions: { maxZoom: 13 } }
                    : { center: BURKINA_CENTER, zoom: 7 })}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapController center={mapCenter} zoom={15} />

                  {/* Shop markers */}
                  {shopsWithDist.map((shop) => (
                    <Marker
                      key={shop.id}
                      position={[shop.latitude, shop.longitude]}
                      icon={shopIcon}
                      eventHandlers={{ click: () => setSelected(shop) }}
                    >
                      <Popup>
                        <div className="min-w-[190px]">
                          <p className="font-bold text-stone-900 mb-0.5">{shop.name}</p>
                          <p className="text-xs text-forest-700 font-medium mb-1">{shop.category}</p>
                          {shop.distance !== null && (
                            <p className="text-xs text-blue-600 font-semibold mb-1">
                              📍 {formatDist(shop.distance)}
                            </p>
                          )}
                          {shop.address && (
                            <p className="text-xs text-stone-500 mb-2 flex items-start gap-1">
                              <MapPin className="w-3 h-3 shrink-0 mt-0.5" /> {shop.address}
                            </p>
                          )}
                          <Link
                            to={`/client/shop/${shop.id}`}
                            className="inline-flex items-center gap-1 bg-forest-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-forest-700 transition-colors font-semibold"
                          >
                            Voir la boutique →
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* User position marker */}
                  {userPos && (
                    <Marker position={userPos} icon={userIcon}>
                      <Popup>
                        <p className="font-semibold text-blue-700 text-sm">📍 Vous êtes ici</p>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              )}
              {loading && (
                <div className="h-full bg-stone-100 animate-pulse flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-stone-300" />
                </div>
              )}
            </div>
            <p className="text-xs text-stone-300 mt-2 text-center">Carte OpenStreetMap · Burkina Faso</p>
          </div>

          {/* Shop list */}
          <div className="space-y-3 max-h-[524px] overflow-y-auto pr-1">
            <p className="text-sm text-stone-400 font-medium">
              {shopsWithDist.length} boutique(s)
              {userPos ? ' · triées par proximité' : ' au Burkina Faso'}
            </p>
            {loading ? (
              [1,2,3].map(i => <div key={i} className="rounded-xl3 h-28 animate-pulse bg-stone-100" />)
            ) : shopsWithDist.length === 0 ? (
              <div className="card text-center py-10">
                <Store className="w-8 h-8 mx-auto text-stone-200 mb-2" />
                <p className="text-stone-400 text-sm">Aucune boutique trouvée</p>
              </div>
            ) : (
              shopsWithDist.map(shop => (
                <div
                  key={shop.id}
                  onClick={() => { setSelected(shop); setMapCenter([shop.latitude, shop.longitude]) }}
                  className={`cursor-pointer rounded-xl3 transition-all ${
                    selected?.id === shop.id
                      ? 'ring-2 ring-forest-500 shadow-forest'
                      : 'hover:shadow-glass'
                  }`}
                >
                  <ShopCard shop={shop} />
                  {shop.distance !== null && (
                    <div className="px-4 pb-3 -mt-1">
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-full">
                        <Navigation className="w-3 h-3" /> {formatDist(shop.distance)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
