import { useEffect, useState } from 'react'
import { userApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { StatusBadge, Spinner, EmptyState, PageHeader } from '../components/shared'
import {
  User, CreditCard, RefreshCw, ChevronLeft, ChevronRight,
  Mail, Phone, Calendar, ShieldCheck
} from 'lucide-react'
import toast from 'react-hot-toast'

function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount || 0)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const METHOD_LABELS = { CARD: '💳 Card', UPI: '📱 UPI', NET_BANKING: '🏦 Net Banking', WALLET: '👛 Wallet' }

export default function UserHomePage() {
  const { user } = useAuthStore()
  const [profile, setProfile]     = useState(null)
  const [txns, setTxns]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [txnLoading, setTxnLoad]  = useState(false)
  const [page, setPage]           = useState(0)
  const [totalPages, setTotal]    = useState(0)

  useEffect(() => { loadAll() }, [])
  useEffect(() => { if (!loading) loadTxns() }, [page])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [profileRes, txnRes] = await Promise.all([
        userApi.getProfile(),
        userApi.myTransactions(0, 8),
      ])
      setProfile(profileRes.data.data)
      setTxns(txnRes.data.data?.content || [])
      setTotal(txnRes.data.data?.totalPages || 0)
    } catch {
      toast.error('Could not load your data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadTxns = async () => {
    setTxnLoad(true)
    try {
      const res = await userApi.myTransactions(page, 8)
      setTxns(res.data.data?.content || [])
      setTotal(res.data.data?.totalPages || 0)
    } catch {
      // Silent — already loaded once, don't spam toasts on pagination errors
    } finally {
      setTxnLoad(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={`Welcome, ${user?.fullName?.split(' ')[0]} 👋`}
        subtitle="Your account overview and payment history"
        action={
          <button onClick={loadAll} className="btn-secondary flex items-center gap-2 text-sm py-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-brand-700">
                {profile?.fullName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-800">{profile?.fullName}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                {profile?.role}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{profile?.email}</span>
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{profile.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Joined {profile?.memberSince
                ? new Date(profile.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                : '—'
              }</span>
            </div>
          </div>
        </div>

        {/* Payment history */}
        <div className="card lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Payment History</h3>
            {txnLoading && <Spinner size="sm" />}
          </div>

          {txns.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments yet"
              subtitle="Your payment history will appear here after you complete a transaction"
            />
          ) : (
            <>
              <div className="divide-y divide-slate-50">
                {txns.map(txn => (
                  <div key={txn.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        txn.status === 'SUCCESS' ? 'bg-emerald-50' : txn.status === 'FAILED' ? 'bg-red-50' : 'bg-amber-50'
                      }`}>
                        <CreditCard className={`w-4 h-4 ${
                          txn.status === 'SUCCESS' ? 'text-emerald-500' : txn.status === 'FAILED' ? 'text-red-500' : 'text-amber-500'
                        }`} />
                      </div>
                      <div>
                        {txn.description && (
                          <p className="text-sm font-medium text-slate-800">{txn.description}</p>
                        )}
                        <p className="text-xs text-slate-400 font-mono">
                          {txn.transactionReference?.substring(0, 22)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {METHOD_LABELS[txn.paymentMethod] || txn.paymentMethod}
                          {txn.cardLastFour && ` · •••• ${txn.cardLastFour}`}
                          {' · '}{txn.createdAt ? formatDate(txn.createdAt) : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <StatusBadge status={txn.status} />
                      <span className="text-sm font-bold text-slate-800">
                        {formatCurrency(txn.amount, txn.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Page {page + 1} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors">
                      <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                      className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
