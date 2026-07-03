import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('marketbf_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [cart, setCart] = useState([])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('marketbf_token', data.token)
    localStorage.setItem('marketbf_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData)
    localStorage.setItem('marketbf_token', data.token)
    localStorage.setItem('marketbf_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const loginWithGoogle = async (credential, role) => {
    const { data } = await api.post('/auth/google', { credential, role })
    localStorage.setItem('marketbf_token', data.token)
    localStorage.setItem('marketbf_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const forgotPassword = async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  }

  const resetPassword = async (token, password) => {
    const { data } = await api.post('/auth/reset-password', { token, password })
    return data
  }

  const logout = () => {
    localStorage.removeItem('marketbf_token')
    localStorage.removeItem('marketbf_user')
    setUser(null)
    setCart([])
  }

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
      }
      return [...prev, { product, quantity }]
    })
  }

  const removeFromCart = (productId) => setCart((prev) => prev.filter((i) => i.product.id !== productId))

  const updateCartQty = (productId, quantity) => {
    if (quantity <= 0) { removeFromCart(productId); return }
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity } : i))
  }

  const clearCart = () => setCart([])

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle, forgotPassword, resetPassword, cart, addToCart, removeFromCart, updateCartQty, clearCart, cartTotal, cartCount }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
