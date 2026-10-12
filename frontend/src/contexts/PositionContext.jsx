import { createContext, useContext, useState, useCallback } from 'react'
import { getCurrentPosition } from '../utils/geo'

/**
 * Position du client, partagée par tout le site et mémorisée sur l'appareil.
 * position = { lat, lng, label, source: 'gps' | 'zone' } ou null.
 */
const PositionContext = createContext(null)

const POS_KEY = 'marketbf_position'
const RADIUS_KEY = 'marketbf_radius'
const ASKED_KEY = 'marketbf_position_asked'

const read = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v) } catch { return fallback }
}
const write = (key, value) => {
  try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)) } catch { /* stockage indisponible */ }
}

export function PositionProvider({ children }) {
  const [position, setPositionState] = useState(() => read(POS_KEY, null))
  const [radius, setRadiusState]     = useState(() => read(RADIUS_KEY, 5))
  const [locating, setLocating]      = useState(false)
  const [pickerOpen, setPickerOpen]  = useState(false)

  const setPosition = useCallback((p) => { setPositionState(p); write(POS_KEY, p); write(ASKED_KEY, true) }, [])
  const setRadius = useCallback((r) => { setRadiusState(r); write(RADIUS_KEY, r) }, [])

  /** Demande la position GPS ; renvoie la position ou lève une erreur lisible. */
  const locate = useCallback(async () => {
    setLocating(true)
    try {
      const { latitude, longitude } = await getCurrentPosition()
      const p = { lat: latitude, lng: longitude, label: 'Ma position', source: 'gps' }
      setPosition(p)
      return p
    } finally {
      setLocating(false)
    }
  }, [setPosition])

  const chooseZone = useCallback((zone) => {
    setPosition({ lat: zone.lat, lng: zone.lng, label: zone.label, source: 'zone' })
  }, [setPosition])

  const openPicker = useCallback(() => setPickerOpen(true), [])
  const closePicker = useCallback(() => { setPickerOpen(false); write(ASKED_KEY, true) }, [])
  const alreadyAsked = () => read(ASKED_KEY, false)

  return (
    <PositionContext.Provider value={{
      position, radius, setRadius, locating, locate, chooseZone,
      pickerOpen, openPicker, closePicker, alreadyAsked,
    }}>
      {children}
    </PositionContext.Provider>
  )
}

export const usePosition = () => useContext(PositionContext)
