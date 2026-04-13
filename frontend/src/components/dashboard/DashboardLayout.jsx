import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, ArrowUpRight, CreditCard, LogOut,
  Bell, ChevronRight, Zap, Menu, X, User, Home
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

// Merchant gets analytics + orders + transactions
const MERCHANT_NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders',       icon: ArrowUpRight,    label: 'Orders' },
  { to: '/transactions', icon: CreditCard,      label: 'Transactions' },
]

// Regular user gets a simple home view
const USER_NAV = [
  { to: '/home', icon: Home,   label: 'Home' },
  { to: '/home', icon: CreditCard, label: 'Payment History' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isMerchant = user?.role === 'MERCHANT' || user?.role === 'ADMIN'
  const navItems = isMerchant ? MERCHANT_NAV : USER_NAV

  const handleLogout = () => {
    logout()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold text-slate-900 tracking-tight">PayVault</span>
        </div>
      </div>

      {/* Role badge — different colour per role */}
      <div className={`px-4 py-3 mx-3 my-4 rounded-xl border ${
        isMerchant
          ? 'bg-brand-50 border-brand-100'
          : 'bg-emerald-50 border-emerald-100'
      }`}>
        <p className={`text-xs font-semibold uppercase tracking-wide ${
          isMerchant ? 'text-brand-600' : 'text-emerald-600'
        }`}>
          {user?.role}
        </p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
          {user?.businessName || user?.fullName}
        </p>
      </div>

      {/* Navigation — role-specific */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={label} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {label}
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-slate-100 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-brand-700">
              {user?.fullName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.fullName}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-100 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-60 bg-white shadow-xl z-10">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-1">
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100">
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-500 rounded-full" />
            </button>
            {/* Only show "New Payment" button to merchants */}
            {isMerchant && (
              <NavLink to="/orders/new"
                className="btn-primary text-sm flex items-center gap-1.5 py-2 px-4">
                <ArrowUpRight className="w-4 h-4" />
                New Payment
              </NavLink>
            )}
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
