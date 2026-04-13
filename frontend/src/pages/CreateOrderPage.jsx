import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { merchantApi } from '../services/api'
import { PageHeader } from '../components/shared'
import { ArrowLeft, Zap, Copy, ExternalLink, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED']

export default function CreateOrderPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(null)
  const [form, setForm] = useState({
    amount: '',
    currency: 'INR',
    description: '',
    customerEmail: '',
    customerName: '',
    customerPhone: '',
  })
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.amount || isNaN(form.amount) || Number(form.amount) < 1) errs.amount = 'Minimum amount is ₹1'
    if (!form.description) errs.description = 'Description is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await merchantApi.createOrder({ ...form, amount: Number(form.amount) })
      setCreated(res.data.data)
      toast.success('Payment order created!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  if (created) {
    return (
      <div className="animate-slide-up max-w-lg mx-auto">
        <div className="card p-8 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Order Created!</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Share the payment link with your customer</p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Details</span>
              <span className="badge-info">{created.status}</span>
            </div>
            {[
              ['Order ID', created.orderReference],
              ['Amount', `${new Intl.NumberFormat('en-IN', { style: 'currency', currency: created.currency }).format(created.amount)}`],
              ['Description', created.description],
              ['Expires', new Date(created.expiresAt).toLocaleString('en-IN')],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 text-sm border-b border-slate-100 last:border-0">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-800 font-mono text-right max-w-[200px] truncate">{v}</span>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 text-left">Payment Link</label>
            <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
              <span className="text-sm text-brand-700 font-mono flex-1 truncate">{created.paymentLink}</span>
              <button onClick={() => { navigator.clipboard.writeText(created.paymentLink); toast.success('Copied!') }}
                className="text-brand-400 hover:text-brand-600 flex-shrink-0">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <a href={created.paymentLink} target="_blank" rel="noreferrer"
              className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
              <ExternalLink className="w-4 h-4" /> Test Payment
            </a>
            <button onClick={() => { setCreated(null); setForm({ amount: '', currency: 'INR', description: '', customerEmail: '', customerName: '', customerPhone: '' }) }}
              className="btn-secondary flex-1 text-sm">
              New Order
            </button>
          </div>

          <button onClick={() => navigate('/orders')} className="mt-3 text-sm text-slate-400 hover:text-slate-600 w-full">
            ← Back to Orders
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-slide-up max-w-2xl mx-auto">
      <PageHeader
        title="Create Payment Order"
        subtitle="Generate a payment link for your customer"
        action={
          <Link to="/orders" className="btn-secondary flex items-center gap-2 text-sm py-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        }
      />

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount + Currency */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount *</label>
            <div className="flex gap-2">
              <select value={form.currency} onChange={set('currency')}
                className="input-field w-28 flex-shrink-0">
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="0.00" min="1" step="0.01"
                value={form.amount} onChange={set('amount')}
                className={`input-field flex-1 ${errors.amount ? 'border-red-300 focus:ring-red-400' : ''}`} />
            </div>
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description *</label>
            <input type="text" placeholder="e.g. Annual subscription, Product purchase..."
              value={form.description} onChange={set('description')}
              className={`input-field ${errors.description ? 'border-red-300 focus:ring-red-400' : ''}`} />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Customer Details <span className="text-slate-400 font-normal">(optional)</span></h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Full name</label>
                <input type="text" placeholder="Customer name" value={form.customerName} onChange={set('customerName')} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Phone</label>
                <input type="tel" placeholder="+91 98765 43210" value={form.customerPhone} onChange={set('customerPhone')} className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-500 mb-1.5">Email</label>
                <input type="email" placeholder="customer@email.com" value={form.customerEmail} onChange={set('customerEmail')} className="input-field" />
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
            <div className="flex gap-2.5">
              <Zap className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-brand-800">Payment link expires in 24 hours</p>
                <p className="text-xs text-brand-600 mt-0.5">
                  Card ending 0000 always fails. Card ending 1111 always succeeds. Others are random (85% success rate).
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Generate Payment Link'}
            </button>
            <Link to="/orders" className="btn-secondary px-6">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
