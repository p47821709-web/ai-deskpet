import { create } from 'zustand'
import {
  SettingsService,
  type AppSettings,
  type PetSettings,
  type ChatAISettings,
  type ImageAISettings,
  type SystemSettings,
  type DisplaySettings,
  DEFAULT_SETTINGS,
} from '../services/SettingsService'

interface SettingsStoreState extends AppSettings {
  /** Whether settings have been initialized */
  initialized: boolean

  // ── Actions ──
  initialize: () => void
  updatePet: (partial: Partial<PetSettings>) => void
  updateChatAI: (partial: Partial<ChatAISettings>) => void
  updateImageAI: (partial: Partial<ImageAISettings>) => void
  updateSystem: (partial: Partial<SystemSettings>) => void
  updateDisplay: (partial: Partial<DisplaySettings>) => void
  resetAll: () => void
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  // State (initialized with defaults, overwritten by initialize())
  ...DEFAULT_SETTINGS,
  initialized: false,

  initialize: () => {
    const settings = SettingsService.load()
    SettingsService.migrateFromLegacy()
    set({
      ...settings,
      initialized: true,
    })
  },

  updatePet: (partial) => {
    const current = get().pet
    const updated = { ...current, ...partial }
    set({ pet: updated })
    SettingsService.set('pet', updated)
  },

  updateChatAI: (partial) => {
    const current = get().chatAI
    const updated = { ...current, ...partial }
    set({ chatAI: updated })
    SettingsService.set('chatAI', updated)
  },

  updateImageAI: (partial) => {
    const current = get().imageAI
    const updated = { ...current, ...partial }
    set({ imageAI: updated })
    SettingsService.set('imageAI', updated)
  },

  updateSystem: (partial) => {
    const current = get().system
    const updated = { ...current, ...partial }
    set({ system: updated })
    SettingsService.set('system', updated)

    // Auto-launch side-effect
    if (partial.autoLaunch !== undefined) {
      SettingsService.setAutoLaunch(partial.autoLaunch)
    }
  },

  updateDisplay: (partial) => {
    const current = get().display
    const updated = { ...current, ...partial }
    set({ display: updated })
    SettingsService.set('display', updated)
  },

  resetAll: () => {
    SettingsService.reset()
    set({ ...DEFAULT_SETTINGS })
  },
}))
