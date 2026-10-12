/**
 * Utilitaires de géolocalisation — couverture : tout le Burkina Faso.
 */

// Principales villes du Burkina Faso (suggestions d'adresse)
export const BF_CITIES = [
  'Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora',
  'Kaya', 'Tenkodogo', 'Fada N\'Gourma', 'Dédougou', 'Dori', 'Gaoua', 'Ziniaré',
]

// Quartiers/secteurs populaires de Ouagadougou (suggestions rapides)
export const OUAGA_QUARTIERS = [
  'Hamdallaye', 'Ouaga 2000', 'Zogona', 'Pissy', 'Gounghin',
  'Tampouy', 'Dapoya', 'Koulouba', 'Wemtenga', 'Secteur 30',
]

// Centre géographique approximatif du Burkina Faso
export const BURKINA_CENTER = [12.2383, -1.5616]

/**
 * Récupère la position GPS de l'utilisateur (promesse).
 * Rejette avec un message d'erreur en français prêt à afficher.
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas supportée par votre navigateur'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => {
        if (err.code === 1) {
          reject(new Error('Accès à la position refusé. Autorisez la géolocalisation dans votre navigateur.'))
        } else {
          reject(new Error('Impossible d\'obtenir votre position. Vérifiez que le GPS est activé et réessayez.'))
        }
      },
      { timeout: 15000, enableHighAccuracy: true }
    )
  })
}

export const mapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`

/**
 * Zones proposées quand le GPS est refusé ou indisponible.
 * Coordonnées approximatives du centre de chaque quartier / ville.
 */
export const ZONES = [
  { group: 'Ouagadougou', label: 'Ouaga centre',  lat: 12.3714, lng: -1.5197 },
  { group: 'Ouagadougou', label: 'Hamdallaye',    lat: 12.3830, lng: -1.5450 },
  { group: 'Ouagadougou', label: 'Ouaga 2000',    lat: 12.3220, lng: -1.4930 },
  { group: 'Ouagadougou', label: 'Zogona',        lat: 12.3820, lng: -1.4970 },
  { group: 'Ouagadougou', label: 'Pissy',         lat: 12.3380, lng: -1.5750 },
  { group: 'Ouagadougou', label: 'Gounghin',      lat: 12.3640, lng: -1.5530 },
  { group: 'Ouagadougou', label: 'Tampouy',       lat: 12.4050, lng: -1.5650 },
  { group: 'Ouagadougou', label: 'Dapoya',        lat: 12.3800, lng: -1.5280 },
  { group: 'Ouagadougou', label: 'Koulouba',      lat: 12.3670, lng: -1.5140 },
  { group: 'Ouagadougou', label: 'Wemtenga',      lat: 12.3710, lng: -1.4810 },
  { group: 'Ouagadougou', label: 'Tanghin',       lat: 12.3980, lng: -1.5130 },
  { group: 'Villes', label: 'Bobo-Dioulasso',     lat: 11.1771, lng: -4.2979 },
  { group: 'Villes', label: 'Koudougou',          lat: 12.2526, lng: -2.3627 },
  { group: 'Villes', label: 'Ouahigouya',         lat: 13.5828, lng: -2.4216 },
  { group: 'Villes', label: 'Banfora',            lat: 10.6333, lng: -4.7667 },
  { group: 'Villes', label: 'Kaya',               lat: 13.0917, lng: -1.0844 },
  { group: 'Villes', label: 'Tenkodogo',          lat: 11.7800, lng: -0.3697 },
  { group: 'Villes', label: "Fada N'Gourma",      lat: 12.0616, lng: 0.3584 },
  { group: 'Villes', label: 'Dédougou',           lat: 12.4634, lng: -3.4608 },
  { group: 'Villes', label: 'Ziniaré',            lat: 12.5833, lng: -1.3000 },
]

// Rayons proposés (km) ; null = tout le Burkina Faso
export const RADIUS_OPTIONS = [1, 3, 5, 10, null]

/** Distance à vol d'oiseau en km entre deux points GPS. */
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km) {
  if (km == null) return ''
  if (km < 1) return `${Math.max(50, Math.round(km * 1000 / 50) * 50)} m`
  return `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`
}

const hasCoords = (lat, lng) => lat != null && lng != null && !Number.isNaN(+lat) && !Number.isNaN(+lng)

/**
 * Ajoute `distance` (km) à chaque élément ayant des coordonnées, filtre par rayon
 * et trie du plus proche au plus loin. Les éléments sans coordonnées passent en fin
 * de liste (et sont exclus si un rayon est appliqué).
 */
export function sortByDistance(items, position, radius = null) {
  if (!position) return items.map(i => ({ ...i, distance: null }))
  return items
    .map(i => ({
      ...i,
      distance: hasCoords(i.latitude, i.longitude)
        ? haversine(position.lat, position.lng, +i.latitude, +i.longitude)
        : null,
    }))
    .filter(i => radius == null || (i.distance != null && i.distance <= radius))
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
}

/** Lien d'itinéraire Google Maps depuis la position actuelle du téléphone. */
export const directionsLink = (lat, lng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
