import { create } from 'zustand';
import { storage } from '../utils/storage';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  magasinActif: null,

  // Charger le token au démarrage de l'app
  init: async () => {
    const token = await storage.get('token');
    const userStr = await storage.get('user');
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) });
    }
  },

  setAuth: async (user, token) => {
    await storage.set('token', token);
    await storage.set('user', JSON.stringify(user));
    set({ user, token });
  },

  logout: async () => {
    await storage.remove('token');
    await storage.remove('user');
    set({ user: null, token: null, magasinActif: null });
  },

  isAuthenticated: () => !!get().token,
  hasRole: (...roles) => {
    const user = get().user;
    return user ? roles.includes(user.role) : false;
  }
}));

export default useAuthStore;