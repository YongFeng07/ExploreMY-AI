import { create } from 'zustand';
interface UIState { isSidebarOpen: boolean; activeSheet: string | null; toggleSidebar: () => void; setSheet: (s: string | null) => void; }
export const useUIStore = create<UIState>(set => ({ isSidebarOpen: false, activeSheet: null, toggleSidebar: () => set(s => ({ isSidebarOpen: !s.isSidebarOpen })), setSheet: s => set({ activeSheet: s }) }));
