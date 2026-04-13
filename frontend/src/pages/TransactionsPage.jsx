import { useEffect, useState } from 'react'
import { merchantApi } from '../services/api'
import { StatusBadge, Spinner, EmptyState, PageHeader } from '../components/shared'
import { CreditCard, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0)
}
function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const METHOD_ICONS = {
  CARD: '💳', UPI: '📱', NET_BANKING: '🏦', WALLET: '👛'
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')

  useEffect(() => { fetchTransactions() }, [page])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await merchantApi.listTransactions(page, 10)
      const data = res.data.data
      setTransactions(data?.content || [])
      setTotalPages(data?.totalPages || 0)
      setTotal(data?.totalElements || 0)
    } catch {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const filtered = transactions.filter(t => {
    const matchSearch = !search || t.transactionReference?.toLowerCase().includes(search.toLowerCase())
      || t.orderReference?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || t.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Transactions"
        subtitle={`${total} total transactions`}
        action={
          <button onClick={fetchTransactions} className="btn-secondary flex items-center gap-2 text-sm py-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search by reference..." value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 text-sm" />
        </div>
        <div className="flex gap-1.5">
          {['ALL', 'SUCCESS', 'FAILED', 'PENDING', 'PROCESSING'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                filter === s
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No transactions found"
            subtitle="Transactions appear here after payments are processed"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Transaction ID', 'Order', 'Amount', 'Method', 'Card', 'Status', 'Time', 'Note'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3.5 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(txn => (
                    <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <span className="text-xs font-mono text-slate-600">{txn.transactionReference?.substring(0, 22)}</span>
                        {txn.retryCount > 0 && (
                          <span className="ml-1.5 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                            retry #{txn.retryCount}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-mono text-slate-500">{txn.orderReference?.substring(0, 16)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-slate-800">{formatCurrency(txn.amount)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm">
                          {METHOD_ICONS[txn.paymentMethod] || '—'}{' '}
                          <span className="text-xs text-slate-500">{txn.paymentMethod || '—'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {txn.cardLastFour ? (
                          <span className="text-xs text-slate-500 font-mono">
                            {txn.cardBrand} •••• {txn.cardLastFour}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={txn.status} /></td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-slate-500">{txn.createdAt ? formatDateTime(txn.createdAt) : '—'}</span>
                      </td>
                      <td className="px-4 py-4">
                        {txn.failureReason ? (
                          <span className="text-xs text-red-500 max-w-[140px] block truncate" title={txn.failureReason}>
                            {txn.failureReason}
                          </span>
                        ) : (
                          txn.status === 'SUCCESS' ? (
                            <span className="text-xs text-emerald-600">Approved</span>
                          ) : '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-100">
                <span className="text-xs text-slate-500">Showing page {page + 1} of {totalPages}</span>
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
  )
}
