import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { paymentApi } from '../services/api'
import { Spinner } from '../components/shared'
import {
  CreditCard, Smartphone, Building2, Wallet, Zap,
  Lock, ShieldCheck, CheckCircle2, XCircle, RefreshCw,
  ChevronRight, Eye, EyeOff
} from 'lucide-react'

function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount || 0)
}

const PAYMENT_METHODS = [
  { id: 'CARD', label: 'Card', icon: CreditCard, desc: 'Credit / Debit card' },
  { id: 'UPI', label: 'UPI', icon: Smartphone, desc: 'GPay, PhonePe, Paytm' },
  { id: 'NET_BANKING', label: 'Net Banking', icon: Building2, desc: 'All major banks' },
  { id: 'WALLET', label: 'Wallet', icon: Wallet, desc: 'Paytm, Amazon Pay' },
]

function formatCard(val) {
  return val.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

export default function PaymentPage() {
  const { token } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [method, setMethod] = useState('CARD')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [showCvv, setShowCvv] = useState(false)
  const [card, setCard] = useState({ number: '', holder: '', expiry: '', cvv: '' })
  const [upiId, setUpiId] = useState('')
  const [step, setStep] = useState('form') // form | processing | done

  useEffect(() => {
    fetchOrder()
  }, [token])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await paymentApi.getOrderByToken(token)
      setOrder(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Payment link is invalid or expired')
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    if (method === 'CARD') {
      if (!card.number || !card.holder || !card.expiry || !card.cvv)
        return alert('Please fill all card details')
    }
    if (method === 'UPI' && !upiId) return alert('Please enter UPI ID')

    setStep('processing')
    setProcessing(true)

    const payload = {
      orderReference: order.orderReference,
      paymentMethod: method,
      ...(method === 'CARD' && {
        cardNumber: card.number.replace(/\s/g, ''),
        cardHolderName: card.holder,
        cvv: card.cvv,
      }),
      ...(method === 'UPI' && { upiId }),
    }

    try {
      const res = await paymentApi.processPayment(payload)
      setResult(res.data.data)
      setStep('done')
    } catch (err) {
      setResult({ status: 'FAILED', failureReason: err.response?.data?.message || 'Payment failed' })
      setStep('done')
    } finally {
      setProcessing(false)
    }
  }

  const handleRetry = async () => {
    if (!result?.id) return
    setStep('processing')
    setProcessing(true)
    const payload = {
      orderReference: order.orderReference,
      paymentMethod: method,
      ...(method === 'CARD' && { cardNumber: card.number.replace(/\s/g, ''), cardHolderName: card.holder, cvv: card.cvv }),
    }
    try {
      const res = await paymentApi.retryPayment(result.id, payload)
      setResult(res.data.data)
    } catch {
      setResult(r => ({ ...r, status: 'FAILED', failureReason: 'Retry failed' }))
    } finally {
      setProcessing(false)
      setStep('done')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading payment details…</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-slate-100">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Link Unavailable</h2>
          <p className="text-sm text-slate-500">{error || 'This payment link has expired or already been used.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-slate-700 tracking-tight">PayVault</span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left — Order info */}
            <div className="bg-gradient-to-b from-brand-700 to-brand-900 text-white p-7 md:w-72 flex-shrink-0">
              <div className="mb-6">
                <p className="text-brand-300 text-xs font-medium uppercase tracking-wider mb-1">Payment to</p>
                <p className="text-lg font-bold">{order.merchantName || 'Merchant'}</p>
              </div>

              <div className="mb-6">
                <p className="text-brand-300 text-xs font-medium uppercase tracking-wider mb-1">Amount</p>
                <p className="text-3xl font-bold tracking-tight">{formatCurrency(order.amount, order.currency)}</p>
              </div>

              {order.description && (
                <div className="mb-6">
                  <p className="text-brand-300 text-xs font-medium uppercase tracking-wider mb-1">For</p>
                  <p className="text-sm text-brand-100">{order.description}</p>
                </div>
              )}

              {order.customerName && (
                <div className="mb-6">
                  <p className="text-brand-300 text-xs font-medium uppercase tracking-wider mb-1">Customer</p>
                  <p className="text-sm text-white">{order.customerName}</p>
                  {order.customerEmail && <p className="text-xs text-brand-300">{order.customerEmail}</p>}
                </div>
              )}

              <div className="pt-4 border-t border-brand-600 space-y-2">
                <div className="flex items-center gap-2 text-xs text-brand-300">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                  256-bit SSL encrypted
                </div>
                <div className="flex items-center gap-2 text-xs text-brand-300">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  PCI DSS compliant
                </div>
              </div>

              {/* Test hint */}
              <div className="mt-5 p-3 bg-brand-800/60 rounded-xl">
                <p className="text-xs text-brand-300 font-medium mb-1.5">Test cards</p>
                <p className="text-xs text-brand-400 font-mono">•••• •••• •••• 1111 → Success</p>
                <p className="text-xs text-brand-400 font-mono">•••• •••• •••• 0000 → Fail</p>
                <p className="text-xs text-brand-400 mt-1">Any CVV/Expiry works</p>
              </div>
            </div>

            {/* Right — Payment form */}
            <div className="flex-1 p-7">
              {step === 'processing' && (
                <div className="flex flex-col items-center justify-center h-full py-16">
                  <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin mb-5" />
                  <h3 className="text-lg font-semibold text-slate-800">Processing payment…</h3>
                  <p className="text-sm text-slate-400 mt-1">Please do not close this window</p>
                </div>
              )}

              {step === 'done' && result && (
                <div className="flex flex-col items-center justify-center h-full py-10 animate-slide-up">
                  {result.status === 'SUCCESS' ? (
                    <>
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Payment Successful!</h3>
                      <p className="text-sm text-slate-500 mt-1.5 mb-6">Your payment has been processed securely</p>
                      <div className="w-full max-w-sm bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm space-y-2.5 mb-6">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Amount paid</span>
                          <span className="font-semibold text-slate-800">{formatCurrency(result.amount, result.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Transaction ID</span>
                          <span className="font-mono text-xs text-slate-600 truncate max-w-[160px]">{result.transactionReference}</span>
                        </div>
                        {result.cardLastFour && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Card</span>
                            <span className="font-medium text-slate-700">{result.cardBrand} •••• {result.cardLastFour}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">You can safely close this window.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-5">
                        <XCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Payment Failed</h3>
                      <p className="text-sm text-red-500 mt-1.5 mb-6">{result.failureReason || 'Something went wrong'}</p>
                      {result.retryCount < 3 && (
                        <button onClick={handleRetry}
                          className="btn-primary flex items-center gap-2">
                          <RefreshCw className="w-4 h-4" /> Try Again
                        </button>
                      )}
                      {result.retryCount >= 3 && (
                        <p className="text-sm text-slate-500">Maximum retry attempts reached. Please contact the merchant.</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {step === 'form' && (
                <>
                  {/* Method tabs */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment Method</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
                        <button key={id} onClick={() => setMethod(id)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-center ${
                            method === id
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                          }`}>
                          <Icon className={`w-5 h-5 ${method === id ? 'text-brand-600' : 'text-slate-400'}`} />
                          <span className="text-xs font-semibold">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card form */}
                  {method === 'CARD' && (
                    <div className="space-y-4 animate-fade-in">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Card Number</label>
                        <div className="relative">
                          <input
                            placeholder="1234 5678 9012 3456"
                            value={card.number}
                            onChange={e => setCard(c => ({ ...c, number: formatCard(e.target.value) }))}
                            className="input-field font-mono pr-12"
                            maxLength={19}
                          />
                          <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cardholder Name</label>
                        <input placeholder="John Doe" value={card.holder}
                          onChange={e => setCard(c => ({ ...c, holder: e.target.value }))}
                          className="input-field uppercase" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Expiry (MM/YY)</label>
                          <input placeholder="08/27" value={card.expiry}
                            onChange={e => {
                              let v = e.target.value.replace(/\D/g, '').substring(0, 4)
                              if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2)
                              setCard(c => ({ ...c, expiry: v }))
                            }}
                            className="input-field font-mono" maxLength={5} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">CVV</label>
                          <div className="relative">
                            <input
                              placeholder="•••"
                              type={showCvv ? 'text' : 'password'}
                              value={card.cvv}
                              onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').substring(0, 4) }))}
                              className="input-field font-mono pr-10"
                              maxLength={4}
                            />
                            <button type="button" onClick={() => setShowCvv(v => !v)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              {showCvv ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI form */}
                  {method === 'UPI' && (
                    <div className="animate-fade-in">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">UPI ID</label>
                      <input placeholder="yourname@upi" value={upiId} onChange={e => setUpiId(e.target.value)}
                        className="input-field" />
                      <p className="text-xs text-slate-400 mt-2">e.g. phone@gpay, name@paytm</p>
                    </div>
                  )}

                  {/* Net Banking / Wallet placeholder */}
                  {(method === 'NET_BANKING' || method === 'WALLET') && (
                    <div className="animate-fade-in bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500">
                      <p className="text-sm font-medium">Simulated — click Pay to proceed</p>
                      <p className="text-xs text-slate-400 mt-1">In production, bank/wallet selection UI would appear here</p>
                    </div>
                  )}

                  <button onClick={handlePay}
                    className="w-full mt-6 bg-brand-600 text-white py-4 rounded-xl font-bold text-base hover:bg-brand-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-200">
                    <Lock className="w-4 h-4" />
                    Pay {formatCurrency(order.amount, order.currency)}
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Secured by PayVault · 256-bit encryption
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
