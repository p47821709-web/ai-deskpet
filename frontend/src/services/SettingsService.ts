/**
 * SettingsService — 设置中心持久化服务
 *
 * 将所有配置保存到 localStorage。
 * 提供类型安全的读写接口和支持事件通知。
 * 完全独立，不依赖任何 UI 框架。
 */

import { ipcBridge } from './ipc-bridge'

// ── Settings schema ─────────────────────────────────────────

export interface PetSettings {
  /** 桌宠名称 */
  petName: string
  /** 桌宠缩放倍率 1-5 */
  petScale: number
  /** 桌宠音量 0-100 */
  petVolume: number
}

export interface AISettings {
  /** 供应商: 'openai' | 'deepseek' | 'custom' */
  aiProvider: string
  /** API 地址 */
  aiApiBase: string
  /** API Key */
  aiApiKey: string
  /** 模型名称 */
  aiModel: string
  /** 图片生成模型名称 */
  aiImageModel: string
}

export interface SystemSettings {
  /** 开机自启 */
  autoLaunch: boolean
  /** 记忆开关 */
  memoryEnabled: boolean
  /** 窗口置顶 */
  alwaysOnTop: boolean
}

export interface DisplaySettings {
  /** 透明度 0-1 */
  opacity: number
  /** 自动行走 */
  autoWalk: boolean
  /** 音效开关 */
  soundEnabled: boolean
}

export interface AppSettings {
  pet: PetSettings
  ai: AISettings
  system: SystemSettings
  display: DisplaySettings
}

// ── Defaults ────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  pet: {
    petName: '小咪',
    petScale: 3,
    petVolume: 70,
  },
  ai: {
    aiProvider: 'openai',
    aiApiBase: 'https://api.openai.com/v1',
    aiApiKey: '',
    aiModel: 'gpt-4o-mini',
    aiImageModel: 'dall-e-3',
  },
  system: {
    autoLaunch: false,
    memoryEnabled: true,
    alwaysOnTop: true,
  },
  display: {
    opacity: 1,
    autoWalk: true,
    soundEnabled: true,
  },
}

// ── Listener type ──────────────────────────────────────────

export type SettingsChangeListener = (
  path: string,
  value: unknown,
) => void

// ── SettingsService ─────────────────────────────────────────

const STORAGE_KEY = 'ai_deskpet_settings'

class SettingsServiceClass {
  private _listeners: Set<SettingsChangeListener> = new Set()
  private _cache: AppSettings | null = null

  // ── Public API ───────────────────────────────────────────

  /** 加载所有设置（从 localStorage，带缓存） */
  load(): AppSettings {
    if (this._cache) return this._cache

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>
        this._cache = this._mergeDefaults(parsed)
        return this._cache!
      }
    } catch (err) {
      console.warn('[SettingsService] Failed to parse settings:', err)
    }

    this._cache = { ...DEFAULT_SETTINGS }
    return this._cache!
  }

  /** 保存全部设置到 localStorage */
  save(settings: Partial<AppSettings>): void {
    const current = this.load()
    this._cache = this._mergeDeep(current, settings)
    this._persist()
    this._notify('*', this._cache)
  }

  /** 获取指定路径的值（支持点号路径如 'ai.aiProvider'） */
  get<T = unknown>(path: string): T {
    const settings = this.load()
    return resolvePath(settings, path) as T
  }

  /** 设置指定路径的值 */
  set(path: string, value: unknown): void {
    const settings = this.load()
    setPath(settings, path, value)
    this._cache = settings
    this._persist()
    this._notify(path, value)
    this._applySideEffects(path, value)
  }

  /** 重置为默认值 */
  reset(): void {
    this._cache = { ...DEFAULT_SETTINGS }
    this._persist()
    this._notify('*', this._cache)

    // Also clear localStorage items that ChatService might read
    localStorage.removeItem('ai_api_key')
    localStorage.removeItem('ai_api_base')
    localStorage.removeItem('ai_model')
  }

  /** 订阅设置变更 */
  onChange(listener: SettingsChangeListener): () => void {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  /** 清除缓存，下次 load() 会重新读取 localStorage */
  clearCache(): void {
    this._cache = null
  }

  // ── Auto-launch (Electron IPC) ──────────────────────────

  async getAutoLaunch(): Promise<boolean> {
    if (ipcBridge.getAutoLaunch) {
      try {
        return await ipcBridge.getAutoLaunch()
      } catch {
        // fallback to localStorage
      }
    }
    return this.get('system.autoLaunch')
  }

  async setAutoLaunch(enabled: boolean): Promise<void> {
    this.set('system.autoLaunch', enabled)

    if (ipcBridge.setAutoLaunch) {
      try {
        await ipcBridge.setAutoLaunch(enabled)
      } catch (err) {
        console.warn('[SettingsService] Failed to set auto-launch:', err)
      }
    }
  }

  // ── Migration helpers ───────────────────────────────────

  /** 将旧版单层设置迁移到新版分组结构 */
  migrateFromLegacy(): void {
    const legacyKeys = ['petScale', 'alwaysOnTop', 'opacity', 'autoWalk', 'soundEnabled']
    let migrated = false
    const current = this.load()

    for (const key of legacyKeys) {
      const legacy = localStorage.getItem(key)
      if (legacy !== null) {
        migrated = true
        switch (key) {
          case 'petScale':
            current.pet.petScale = Number(legacy)
            break
          case 'alwaysOnTop':
            current.system.alwaysOnTop = legacy === 'true'
            break
          case 'opacity':
            current.display.opacity = Number(legacy)
            break
          case 'autoWalk':
            current.display.autoWalk = legacy === 'true'
            break
          case 'soundEnabled':
            current.display.soundEnabled = legacy === 'true'
            break
        }
        localStorage.removeItem(key)
      }
    }

    // Also migrate old AI settings
    const oldApiKey = localStorage.getItem('ai_api_key')
    const oldApiBase = localStorage.getItem('ai_api_base')
    const oldModel = localStorage.getItem('ai_model')
    if (oldApiKey || oldApiBase || oldModel) {
      migrated = true
      current.ai = {
        ...current.ai,
        aiApiKey: oldApiKey || current.ai.aiApiKey,
        aiApiBase: oldApiBase || current.ai.aiApiBase,
        aiModel: oldModel || current.ai.aiModel,
      }
      localStorage.removeItem('ai_api_key')
      localStorage.removeItem('ai_api_base')
      localStorage.removeItem('ai_model')
    }

    if (migrated) {
      this._cache = current
      this._persist()
    }
  }

  // ── Internal ────────────────────────────────────────────

  private _persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._cache))
    } catch (err) {
      console.error('[SettingsService] Failed to persist settings:', err)
    }
  }

  private _mergeDefaults(partial: Partial<AppSettings>): AppSettings {
    return this._mergeDeep({ ...DEFAULT_SETTINGS }, partial) as AppSettings
  }

  private _mergeDeep<T>(target: T, source: Partial<T>): T {
    const result = { ...target }
    for (const key of Object.keys(source) as (keyof T)[]) {
      const val = source[key]
      if (val !== undefined && typeof val === 'object' && !Array.isArray(val) && val !== null) {
        result[key] = this._mergeDeep(result[key] as any, val as any)
      } else if (val !== undefined) {
        result[key] = val as any
      }
    }
    return result
  }

  private _notify(path: string, value: unknown): void {
    for (const listener of this._listeners) {
      try {
        listener(path, value)
      } catch {
        // Silently ignore listener errors
      }
    }
  }

  /** 应用设置的副作用（如同步到 Electron IPC） */
  private _applySideEffects(path: string, value: unknown): void {
    if (path === 'ai.aiApiKey' && typeof value === 'string') {
      // ChatService 会通过 get() 读取，无需额外操作
    }
  }
}

// ── Singleton ──────────────────────────────────────────────

export const SettingsService = new SettingsServiceClass()

// ── Path helpers ──────────────────────────────────────────

function resolvePath(obj: Record<string, any>, path: string): unknown {
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, any>)[part]
    return undefined
  }, obj as unknown)
}

function setPath(obj: Record<string, any>, path: string, value: unknown): void {
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {}
    }
    current = current[parts[i]]
  }
  current[parts[parts.length - 1]] = value
}

