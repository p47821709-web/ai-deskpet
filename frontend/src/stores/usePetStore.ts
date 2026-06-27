import { create } from 'zustand'

interface PetState {
  activePetId: string | null
  currentEmotion: string
  position: { x: number; y: number }
  affection: number
  energy: number
  mood: number
  setActivePet: (id: string | null) => void
  setEmotion: (emotion: string) => void
  updatePosition: (x: number, y: number) => void
}

export const usePetStore = create<PetState>((set) => ({
  activePetId: null,
  currentEmotion: 'neutral',
  position: { x: 100, y: 100 },
  affection: 50,
  energy: 80,
  mood: 60,
  setActivePet: (id) => set({ activePetId: id }),
  setEmotion: (emotion) => set({ currentEmotion: emotion }),
  updatePosition: (x, y) => set({ position: { x, y } }),
}))
