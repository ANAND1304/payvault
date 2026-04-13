import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Centralised response handling.
// 401 → force logout. 403 → let the page handle it with role-aware UX.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
}

// ─── Merchant APIs  (MERCHANT + ADMIN only) ─────────────────────────
export const merchantApi = {
  dashboardStats:   ()                    => api.get('/merchant/dashboard/stats'),
  createOrder:      (data)                => api.post('/merchant/orders', data),
  listOrders:       (page = 0, size = 10) => api.get(`/merchant/orders?page=${page}&size=${size}`),
  getOrder:         (ref)                 => api.get(`/merchant/orders/${ref}`),
  listTransactions: (page = 0, size = 10) => api.get(`/merchant/transactions?page=${page}&size=${size}`),
}

// ─── User APIs  (USER + MERCHANT + ADMIN) ────────────────────────────
export const userApi = {
  getProfile:     ()                    => api.get('/user/profile'),
  myTransactions: (page = 0, size = 10) => api.get(`/user/transactions?page=${page}&size=${size}`),
}

// ─── Payment (public) ────────────────────────────────────────────────
export const paymentApi = {
  getOrderByToken: (token)       => api.get(`/pay/link/${token}`),
  processPayment:  (data)        => api.post('/pay/process', data),
  retryPayment:    (txnId, data) => api.post(`/pay/retry/${txnId}`, data),
}

export default api
