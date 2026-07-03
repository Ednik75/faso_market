import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

import ClientDashboard from './pages/client/Dashboard'
import SearchProducts from './pages/client/SearchProducts'
import ShopsMap from './pages/client/ShopsMap'
import ClientOrders from './pages/client/Orders'
import Cart from './pages/client/Cart'
import ShopDetail from './pages/client/ShopDetail'
import Catalog from './pages/client/Catalog'

import MerchantDashboard from './pages/merchant/Dashboard'
import MerchantProducts from './pages/merchant/Products'
import MerchantStock from './pages/merchant/Stock'
import MerchantOrders from './pages/merchant/Orders'
import MerchantStatistics from './pages/merchant/Statistics'
import ShopProfile from './pages/merchant/ShopProfile'

import AdminDashboard from './pages/admin/Dashboard'
import AdminShops from './pages/admin/Shops'
import AdminUsers from './pages/admin/Users'

function PrivateRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <ForgotPassword />} />
      <Route path="/reset-password" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <ResetPassword />} />

      {/* Client routes */}
      <Route path="/client/dashboard" element={<PrivateRoute role="client"><ClientDashboard /></PrivateRoute>} />
      <Route path="/client/search" element={<PrivateRoute role="client"><SearchProducts /></PrivateRoute>} />
      <Route path="/client/catalog" element={<PrivateRoute role="client"><Catalog /></PrivateRoute>} />
      <Route path="/client/map" element={<PrivateRoute role="client"><ShopsMap /></PrivateRoute>} />
      <Route path="/client/orders" element={<PrivateRoute role="client"><ClientOrders /></PrivateRoute>} />
      <Route path="/client/cart" element={<PrivateRoute role="client"><Cart /></PrivateRoute>} />
      <Route path="/client/shop/:id" element={<PrivateRoute role="client"><ShopDetail /></PrivateRoute>} />

      {/* Merchant routes */}
      <Route path="/merchant/dashboard" element={<PrivateRoute role="merchant"><MerchantDashboard /></PrivateRoute>} />
      <Route path="/merchant/products" element={<PrivateRoute role="merchant"><MerchantProducts /></PrivateRoute>} />
      <Route path="/merchant/stock" element={<PrivateRoute role="merchant"><MerchantStock /></PrivateRoute>} />
      <Route path="/merchant/orders" element={<PrivateRoute role="merchant"><MerchantOrders /></PrivateRoute>} />
      <Route path="/merchant/statistics" element={<PrivateRoute role="merchant"><MerchantStatistics /></PrivateRoute>} />
      <Route path="/merchant/profile" element={<PrivateRoute role="merchant"><ShopProfile /></PrivateRoute>} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/shops" element={<PrivateRoute role="admin"><AdminShops /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute role="admin"><AdminUsers /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
