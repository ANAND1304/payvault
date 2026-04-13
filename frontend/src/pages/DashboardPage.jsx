import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { merchantApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { StatCard, StatusBadge, Spinner, PageHeader } from '../components/shared'
import {
  TrendingUp, CreditCard, AlertCircle, IndianRupee,
  ArrowUpRight, RefreshCw, Copy, CheckCheck, Clock
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import toast from 'react-hot-toast'

const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b']

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount || 0)
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

// Simulated weekly sparkline — replace with real data when available
const WEEK_CHART = [
  { day: 'Mon', amount: 24000 }, { day: 'Tue', amount: 38000 },
  { day: 'Wed', amount: 31000 }, { day: 'Thu', amount: 52000 },
  { day: 'Fri', amount: 47000 }, { day: 'Sat', amount: 29000 },
  { day: 'Sun', amount: 18000 },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats]       = useState(null)
  const [recentTxns, setRecent] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [copied, setCopied]     = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, txnRes] = await Promise.all([
        merchantApi.dashboardStats(),
        merchantApi.listTransactions(0, 5),
      ])
      setStats(statsRes.data.data)
      setRecent(txnRes.data.data?.content || [])
    } catch (err) {
      const code = err.response?.status
      if (code === 403) {
        // This page is behind MerchantRoute so 403 should never appear here,
        // but guard defensively anyway.
        setError('merchant-only')
      } else {
        setError('load-failed')
        toast.error('Could not load dashboard data. Check your connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(user?.apiKey || '')
    setCopied(true)
    toast.success('API key copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error === 'merchant-only') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-amber-500" />
        </div>
        <p className="text-base font-semibold text-slate-700">Merchant access required</p>
        <p className="text-sm text-slate-400">The dashboard is only available to merchant accounts.</p>
      </div>
    )
  }

  if (error === 'load-failed') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <p className="text-sm text-slate-500">Failed to load dashboard data.</p>
        <button onClick={loadData} className="btn-secondary text-sm flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    )
  }

  const pieData = stats ? [
    { name: 'Success', value: Number(stats.successfulTransactions) },
    { name: 'Failed',  value: Number(stats.failedTransactions) },
    { name: 'Pending', value: Number(stats.pendingTransactions) },
  ].filter(d => d.value > 0) : []

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={`Good ${getGreeting()}, ${user?.fullName?.split(' ')[0]} 👋`}
        subtitle="Here's what's happening with your payments today"
        action={
          <button onClick={loadData} className="btn-secondary flex items-center gap-2 text-sm py-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue"   value={formatCurrency(stats?.totalRevenue)}     subtext="All time"                                            icon={IndianRupee} iconBg="bg-brand-50"   iconColor="text-brand-600" />
        <StatCard label="This Month"      value={formatCurrency(stats?.revenueThisMonth)} subtext={`${stats?.ordersToday || 0} orders today`}           icon={TrendingUp}  iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Successful"      value={stats?.successfulTransactions || 0}      subtext={`${stats?.successRate?.toFixed(1) || 0}% success`}   icon={CreditCard}  iconBg="bg-green-50"   iconColor="text-green-600" />
        <StatCard label="Failed"          value={stats?.failedTransactions || 0}          subtext={`${stats?.pendingTransactions || 0} pending`}         icon={AlertCircle} iconBg="bg-red-50"     iconColor="text-red-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800 mb-0.5">Revenue — last 7 days</h3>
          <p className="text-xs text-slate-400 mb-4">Simulated trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={WEEK_CHART} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3d6ef0" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3d6ef0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="amount" stroke="#3d6ef0" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-0.5">Transaction split</h3>
          <p className="text-xs text-slate-400 mb-4">By status</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-slate-500">{d.name}</span>
                    </div>
                    <span className="font-medium text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-slate-400">No data yet</div>
          )}
        </div>
      </div>

      {/* API Key + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">API Credentials</h3>
          <div className="space-y-3">
            <p className="text-xs text-slate-400 mb-1.5">Live API Key</p>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="text-xs font-mono text-slate-600 flex-1 truncate">
                {user?.apiKey ? `${user.apiKey.substring(0, 20)}…` : 'Not available'}
              </span>
              <button onClick={copyApiKey} className="text-slate-400 hover:text-brand-600 transition-colors">
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-700 font-medium">Keep your API key secret</p>
              <p className="text-xs text-amber-600 mt-0.5">Never expose it in client-side code</p>
            </div>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Recent Transactions</h3>
            <Link to="/transactions" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {recentTxns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Clock className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTxns.map(txn => (
                <div key={txn.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      txn.status === 'SUCCESS' ? 'bg-emerald-50' : txn.status === 'FAILED' ? 'bg-red-50' : 'bg-amber-50'
                    }`}>
                      <CreditCard className={`w-4 h-4 ${
                        txn.status === 'SUCCESS' ? 'text-emerald-500' : txn.status === 'FAILED' ? 'text-red-500' : 'text-amber-500'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 font-mono">{txn.transactionReference?.substring(0, 18)}…</p>
                      <p className="text-xs text-slate-400">
                        {txn.cardBrand} •••• {txn.cardLastFour} · {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={txn.status} />
                    <span className="text-sm font-semibold text-slate-800">
                      {formatCurrency(txn.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
