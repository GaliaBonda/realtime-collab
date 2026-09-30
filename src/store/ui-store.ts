import { create } from "zustand";

type UiState = {
  chatOpen: boolean;
  sidebarOpen: boolean;
  setChatOpen: (open: boolean) => void;
  toggleChat: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  chatOpen: true,
  sidebarOpen: true,
  setChatOpen: (chatOpen) => set({ chatOpen }),
  toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
