import { create } from 'zustand';

const useUiStore = create((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleCollapse: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarOpen: (open) => set({ sidebarOpen: open })
}));

export default useUiStore;