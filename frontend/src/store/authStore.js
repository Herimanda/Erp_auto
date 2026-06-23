import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      magasinActif: null,

      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },

      setMagasinActif: (magasin) => set({ magasinActif: magasin }),

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, magasinActif: null });
      },

      isAuthenticated: () => !!get().token,

      hasRole: (...roles) => {
        const user = get().user;
        return user ? roles.includes(user.role) : false;
      }
    }),
    {
      name: 'erp-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        magasinActif: state.magasinActif
      })
    }
  )
);

export default useAuthStore;