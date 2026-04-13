import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import CreateOrderPage from './pages/CreateOrderPage'
import TransactionsPage from './pages/TransactionsPage'
import UserHomePage from './pages/UserHomePage'
import PaymentPage from './pages/PaymentPage'
import DashboardLayout from './components/dashboard/DashboardLayout'

// Redirect unauthenticated users to /login
function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Redirect already-logged-in users away from auth pages
function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return !isAuthenticated ? children : <Navigate to="/home" replace />
}

// Only MERCHANT or ADMIN may enter; USER gets redirected to their home
function MerchantRoute({ children }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'MERCHANT' && user.role !== 'ADMIN') {
    return <Navigate to="/home" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/pay/:token" element={<PaymentPage />} />

      {/* Authenticated shell */}
      <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        {/* Smart default redirect based on role */}
        <Route index element={<RoleRedirect />} />

        {/* USER home — accessible by all authenticated roles */}
        <Route path="home" element={<UserHomePage />} />

        {/* Merchant-only routes */}
        <Route path="dashboard"     element={<MerchantRoute><DashboardPage /></MerchantRoute>} />
        <Route path="orders"        element={<MerchantRoute><OrdersPage /></MerchantRoute>} />
        <Route path="orders/new"    element={<MerchantRoute><CreateOrderPage /></MerchantRoute>} />
        <Route path="transactions"  element={<MerchantRoute><TransactionsPage /></MerchantRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Sends the user to the right landing page based on their role
function RoleRedirect() {
  const role = useAuthStore(s => s.user?.role)
  if (role === 'MERCHANT' || role === 'ADMIN') return <Navigate to="/dashboard" replace />
  return <Navigate to="/home" replace />
}
