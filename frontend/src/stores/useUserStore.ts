import { create } from 'zustand'

interface UserState {
  deviceId: string
  isRegistered: boolean
  nickname: string
  setUser: (data: Partial<UserState>) => void
}

export const useUserStore = create<UserState>((set) => ({
  deviceId: '',
  isRegistered: false,
  nickname: '',
  setUser: (data) => set(data),
}))
