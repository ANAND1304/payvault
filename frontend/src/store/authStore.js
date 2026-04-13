import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (authData) => {
        set({
          user: {
            id: authData.userId,
            email: authData.email,
            fullName: authData.fullName,
            businessName: authData.businessName,
            role: authData.role,
            apiKey: authData.apiKey,
          },
          token: authData.token,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      getToken: () => get().token,
      getRole: () => get().user?.role,
      isMerchant: () => get().user?.role === 'MERCHANT',
      isAdmin: () => get().user?.role === 'ADMIN',
    }),
    {
      name: 'payvault-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
