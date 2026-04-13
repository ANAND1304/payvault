import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { merchantApi } from '../services/api'
import { StatusBadge, Spinner, EmptyState, PageHeader } from '../components/shared'
import { Plus, ArrowUpRight, Copy, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0)
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => { fetchOrders() }, [page])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await merchantApi.listOrders(page, 10)
      const data = res.data.data
      setOrders(data?.content || [])
      setTotalPages(data?.totalPages || 0)
      setTotal(data?.totalElements || 0)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = (link) => {
    navigator.clipboard.writeText(link)
    toast.success('Payment link copied!')
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Payment Orders"
        subtitle={`${total} total orders`}
        action={
          <Link to="/orders/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            New Order
          </Link>
        }
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ArrowUpRight}
            title="No orders yet"
            subtitle="Create your first payment order to get started"
            action={
              <Link to="/orders/new" className="btn-primary text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Order
              </Link>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Order ID', 'Customer', 'Amount', 'Status', 'Payment Link', 'Created', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono text-slate-700 font-medium">{order.orderReference}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-800">{order.customerName || '—'}</p>
                        <p className="text-xs text-slate-400">{order.customerEmail || ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-slate-800">{formatCurrency(order.amount)}</span>
                        <span className="text-xs text-slate-400 ml-1">{order.currency}</span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4">
                        {order.paymentLink ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 font-mono truncate max-w-[120px]">
                              {order.paymentLink.replace('http://localhost:5173', '')}
                            </span>
                            <button onClick={() => copyLink(order.paymentLink)}
                              className="text-slate-300 hover:text-brand-500 transition-colors opacity-0 group-hover:opacity-100">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a href={order.paymentLink} target="_blank" rel="noreferrer"
                              className="text-slate-300 hover:text-brand-500 transition-colors opacity-0 group-hover:opacity-100">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-500">{formatDateTime(order.createdAt)}</span>
                      </td>
                      <td className="px-5 py-4">
                        {order.status === 'CREATED' && (
                          <a href={order.paymentLink} target="_blank" rel="noreferrer"
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                            Pay <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
                <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
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
