import { create } from 'zustand'

interface AppState {
  isInitialized: boolean
  isMinimized: boolean
  overlayVisible: boolean
  chatWindowVisible: boolean
  isOnline: boolean
  backendConnected: boolean
  initialize: () => void
  toggleOverlay: () => void
  toggleChatWindow: () => void
}

export const useAppStore = create<AppState>((set) => ({
  isInitialized: false,
  isMinimized: false,
  overlayVisible: false,
  chatWindowVisible: false,
  isOnline: true,
  backendConnected: false,
  initialize: () => set({ isInitialized: true }),
  toggleOverlay: () => set((s) => ({ overlayVisible: !s.overlayVisible })),
  toggleChatWindow: () => set((s) => ({ chatWindowVisible: !s.chatWindowVisible })),
}))
