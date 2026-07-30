import { create } from 'zustand';

const useUiStore = create((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  modalOpenCallback: null, // ← nouveau

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleCollapse: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Enregistre la fonction de fermeture de la modale actuellement ouverte
  registerModalClose: (closeFn) => set({ modalOpenCallback: closeFn }),
  clearModalClose: () => set({ modalOpenCallback: null }),
}));

export default useUiStore;