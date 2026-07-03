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
