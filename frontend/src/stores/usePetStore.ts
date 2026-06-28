import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StoredPet {
  id: string
  name: string
  imageUrl: string
  style: string
  pixelSize: number
  createdAt: string
  interactions: number
  lastInteraction: string
}

interface PetStoreState {
  pets: StoredPet[]
  addPet: (pet: StoredPet) => void
  removePet: (id: string) => void
  getPet: (id: string) => StoredPet | undefined
}

export const usePetStore = create<PetStoreState>()(
  persist(
    (set, get) => ({
      pets: [],

      addPet: (pet: StoredPet) =>
        set((state) => ({ pets: [...state.pets, pet] })),

      removePet: (id: string) =>
        set((state) => ({ pets: state.pets.filter((p) => p.id !== id) })),

      getPet: (id: string) => get().pets.find((p) => p.id === id),
    }),
    {
      name: 'ai_deskpet_pets',
    },
  ),
)