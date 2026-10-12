import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BURKINA_CENTER, formatDistance, directionsLink } from '../utils/geo'

const shopIcon = (active) => new L.DivIcon({
  className: '',
  html: `<svg width="${active ? 36 : 30}" height="${active ? 48 : 40}" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 39s13-12.6 13-23.5C28 7.5 22.2 1.5 15 1.5S2 7.5 2 15.5C2 26.4 15 39 15 39z" fill="${active ? '#1c1917' : '#b8461f'}" stroke="#fff" stroke-width="2"/>
    <circle cx="15" cy="15.5" r="5" fill="#f2b630"/>
  </svg>`,
  iconSize: active ? [36, 48] : [30, 40],
  iconAnchor: active ? [18, 47] : [15, 39],
  popupAnchor: [0, -34],
})
const ICON = shopIcon(false)
const ICON_ACTIVE = shopIcon(true)

const userIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#0284c7;border:3px solid white;border-radius:50%;box-shadow:0 0 0 6px rgba(2,132,199,0.2);"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
})

/** Recadre la carte sur la position + le rayon, ou sur l'ensemble des boutiques. */
function FitView({ position, radius, shops, selected }) {
  const map = useMap()
  useEffect(() => {
    if (selected?.latitude != null) {
      map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 15), { duration: 0.8 })
      return
    }
    if (position && radius) {
      map.fitBounds(L.latLng(position.lat, position.lng).toBounds(radius * 2000), { padding: [24, 24] })
    } else if (shops.length) {
      const pts = shops.map(s => [s.latitude, s.longitude])
      if (position) pts.push([position.lat, position.lng])
      map.fitBounds(L.latLngBounds(pts).pad(0.25), { maxZoom: 14 })
    } else if (position) {
      map.setView([position.lat, position.lng], 13)
    }
  }, [map, position?.lat, position?.lng, radius, shops.length, selected?.id])
  return null
}

export default function ShopsMapView({ shops, position, radius, selected, onSelect, height = 520 }) {
  const located = shops.filter(s => s.latitude != null && s.longitude != null)
  return (
    <div className="relative z-0 rounded-xl3 overflow-hidden border border-paper-200 shadow-soft" style={{ height }}>
      <MapContainer center={position ? [position.lat, position.lng] : BURKINA_CENTER} zoom={position ? 13 : 7}
        style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <FitView position={position} radius={radius} shops={located} selected={selected} />

        {position && radius && (
          <Circle center={[position.lat, position.lng]} radius={radius * 1000}
            pathOptions={{ color: '#b8461f', weight: 1.5, fillColor: '#b8461f', fillOpacity: 0.06, dashArray: '4 6' }} />
        )}
        {position && <Marker position={[position.lat, position.lng]} icon={userIcon} />}

        {located.map(shop => (
          <Marker key={shop.id} position={[shop.latitude, shop.longitude]}
            icon={selected?.id === shop.id ? ICON_ACTIVE : ICON}
            eventHandlers={{ click: () => onSelect?.(shop) }}>
            <Popup>
              <div className="min-w-[200px] font-sans">
                <p className="font-semibold text-ink-900 text-sm">{shop.name}</p>
                <p className="text-xs text-stone-500">
                  {shop.category}{shop.distance != null && <> · <span className="font-semibold text-brand-700">{formatDistance(shop.distance)}</span></>}
                </p>
                <div className="flex gap-2 mt-3">
                  <Link to={`/client/shop/${shop.id}`}
                    className="flex-1 text-center !text-white bg-ink-900 hover:bg-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                    Voir
                  </Link>
                  <a href={directionsLink(shop.latitude, shop.longitude)} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center !text-ink-900 border border-paper-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                    Itinéraire
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
