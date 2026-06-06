/**
 * PetMoodManager — 桌宠主动互动模块
 *
 * Manages the pet's internal mood state and randomly triggers
 * proactive interactions (speech bubbles) on a 30-120 min interval.
 *
 * Completely independent from the chat system.
 * Only depends on PetRenderer for visual feedback.
 */

import type { PetRenderer } from './PetRenderer'

// ── Types ────────────────────────────────────────────────────

export type PetMood =
  | 'happy'     // 开心 — 主动问候、分享快乐
  | 'bored'     // 无聊 — 求关注、求互动
  | 'sleepy'    // 困倦 — 提醒休息、道晚安

export interface MoodMessage {
  /** The message text to show in the speech bubble */
  text: string
  /** Optional PetAction to trigger alongside the message */
  action?: 'stand' | 'walk' | 'sleep' | 'wake' | 'interact'
  /** Weight for random selection (higher = more likely) */
  weight?: number
}

export interface PetMoodManagerConfig {
  /** Minimum interval between proactive interactions (ms) */
  minIntervalMs: number
  /** Maximum interval between proactive interactions (ms) */
  maxIntervalMs: number
  /** Whether the manager is enabled */
  enabled: boolean
  /** Morning hour (0-23) when pet becomes active */
  morningHour: number
  /** Night hour (0-23) when pet becomes sleepy */
  nightHour: number
  /** Custom messages per mood (will merge with defaults) */
  customMessages?: Partial<Record<PetMood, MoodMessage[]>>
}

// ── Default messages per mood ───────────────────────────────

const DEFAULT_MESSAGES: Record<PetMood, MoodMessage[]> = {
  happy: [
    { text: '主人你来啦！今天心情超好！🎉', action: 'interact', weight: 3 },
    { text: '主人今天开心吗？😊', weight: 5 },
    { text: '和主人在一起最开心了！✨', weight: 2 },
    { text: '今天天气真好呀！主人要出去玩吗？☀️', weight: 2 },
    { text: '嘿嘿，我今天特别有精神！💪', weight: 2 },
    { text: '主人今天有没有想我呀？🥰', weight: 4 },
    { text: '今天也是元气满满的一天呢！🌟', weight: 2 },
  ],
  bored: [
    { text: '主人～陪我玩一会儿嘛～🥺', action: 'interact', weight: 5 },
    { text: '好无聊啊……主人理理我呗😶', weight: 4 },
    { text: '主人工作累了吗？歇会儿陪我玩玩？💼', weight: 4 },
    { text: '我在桌上待了好久啦～主人看看我嘛👀', weight: 3 },
    { text: '好想和主人说话呀💬', weight: 3 },
    { text: '主人你还在忙吗？我已经等了好久啦⏰', weight: 3 },
    { text: '来看看我今天学会了什么新表情！😄', weight: 2 },
  ],
  sleepy: [
    { text: '主人该喝水啦！💧', action: 'interact', weight: 3 },
    { text: '已经很晚了，主人早点休息吧🌙', weight: 4 },
    { text: '主人工作累了吗？要注意休息哦😴', weight: 4 },
    { text: '好困啊……主人晚安～💤', action: 'sleep', weight: 3 },
    { text: '熬夜对身体不好哦，主人快去睡吧🛌', weight: 3 },
    { text: '我快要睡着了……zzZ😪', weight: 3 },
    { text: '主人今天过得怎么样？要和我聊聊吗？🌃', weight: 2 },
  ],
}

const MOOD_EMOJI: Record<PetMood, string> = {
  happy: '😊',
  bored: '😶',
  sleepy: '😴',
}

// ── Default config ──────────────────────────────────────────

const DEFAULT_CONFIG: PetMoodManagerConfig = {
  minIntervalMs: 30 * 60 * 1000,   // 30 minutes
  maxIntervalMs: 120 * 60 * 1000,  // 120 minutes
  enabled: true,
  morningHour: 7,
  nightHour: 22,
}

// ── PetMoodManager ──────────────────────────────────────────

export class PetMoodManager {
  private _renderer: PetRenderer
  private _config: PetMoodManagerConfig
  private _currentMood: PetMood = 'happy'
  private _timerId: ReturnType<typeof setTimeout> | null = null
  private _messages: Record<PetMood, MoodMessage[]>
  private _isDestroyed: boolean = false
  private _lastInteractionTime: number = Date.now()

  constructor(
    renderer: PetRenderer,
    config: Partial<PetMoodManagerConfig> = {},
  ) {
    this._renderer = renderer
    this._config = { ...DEFAULT_CONFIG, ...config }

    // Merge messages
    this._messages = {
      happy: [...DEFAULT_MESSAGES.happy],
      bored: [...DEFAULT_MESSAGES.bored],
      sleepy: [...DEFAULT_MESSAGES.sleepy],
    }
    if (config.customMessages) {
      for (const mood of Object.keys(config.customMessages) as PetMood[]) {
        const custom = config.customMessages[mood]
        if (custom) {
          this._messages[mood] = [...this._messages[mood], ...custom]
        }
      }
    }
  }

  // ── Public API ────────────────────────────────────────────

  /** Start the proactive interaction timer. */
  start(): void {
    if (this._isDestroyed) return
    this._scheduleNext()
  }

  /** Stop the proactive interaction timer. */
  stop(): void {
    this._clearTimer()
  }

  /** Restart with a fresh timer. */
  restart(): void {
    this.stop()
    this.start()
  }

  /** Get the current mood. */
  get currentMood(): PetMood {
    return this._currentMood
  }

  /** Get the emoji for the current mood. */
  get currentMoodEmoji(): string {
    return MOOD_EMOJI[this._currentMood]
  }

  /** Update config at runtime. */
  updateConfig(partial: Partial<PetMoodManagerConfig>): void {
    Object.assign(this._config, partial)
  }

  /** Record an external interaction (e.g., user clicked pet). This resets the timer. */
  recordInteraction(): void {
    this._lastInteractionTime = Date.now()
    this._currentMood = 'happy'
    this.restart()
  }

  /** Manually trigger a proactive message for testing. */
  triggerNow(mood?: PetMood): void {
    const targetMood = mood || this._determineMood()
    const message = this._pickMessage(targetMood)
    if (message) {
      this._showMessage(targetMood, message)
    }
  }

  /** Clean up resources. */
  destroy(): void {
    this._isDestroyed = true
    this._clearTimer()
  }

  // ── Internal: Timer ──────────────────────────────────────

  private _scheduleNext(): void {
    if (!this._config.enabled || this._isDestroyed) return

    this._clearTimer()

    const delay = this._randomInterval()
    const nextTime = new Date(Date.now() + delay)

    this._timerId = setTimeout(() => {
      if (this._isDestroyed) return
      this._onTimerFired()
      // Schedule next after this interaction completes
      this._scheduleNext()
    }, delay)
  }

  private _onTimerFired(): void {
    // Skip if user recently interacted (within last 5 min)
    const minutesSinceInteraction = (Date.now() - this._lastInteractionTime) / (60 * 1000)
    if (minutesSinceInteraction < 5) return

    const mood = this._determineMood()
    this._currentMood = mood

    const message = this._pickMessage(mood)
    if (message) {
      this._showMessage(mood, message)
    }
  }

  private _clearTimer(): void {
    if (this._timerId !== null) {
      clearTimeout(this._timerId)
      this._timerId = null
    }
  }

  // ── Internal: Mood determination ─────────────────────────

  private _determineMood(): PetMood {
    const hour = new Date().getHours()

    // Night time → sleepy
    if (hour >= this._config.nightHour || hour < this._config.morningHour) {
      return 'sleepy'
    }

    // Random mood distribution during daytime
    const roll = Math.random()

    // If it's been a long time since last interaction, more likely bored
    const hoursSinceInteraction = (Date.now() - this._lastInteractionTime) / (60 * 60 * 1000)
    const boredBias = Math.min(hoursSinceInteraction / 4, 0.5) // 0 to 0.5

    if (roll < 0.4 + boredBias) {
      // More bored if long time no interaction
      return 'bored'
    }

    // Default to happy
    return 'happy'
  }

  // ── Internal: Message selection ──────────────────────────

  private _pickMessage(mood: PetMood): MoodMessage | null {
    const messages = this._messages[mood]
    if (!messages || messages.length === 0) return null

    return weightedRandom(messages)
  }

  private _showMessage(mood: PetMood, message: MoodMessage): void {
    // Show speech bubble
    this._renderer.showBubble(message.text, 4000)

    // Trigger pet action if specified
    if (message.action) {
      setTimeout(() => {
        if (!this._isDestroyed) {
          this._renderer.triggerAction(message.action!)
        }
      }, 200)
    }
  }

  // ── Internal: Helpers ────────────────────────────────────

  private _randomInterval(): number {
    const { minIntervalMs, maxIntervalMs } = this._config
    return minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs)
  }
}

// ── Weighted random selection ──────────────────────────────

function weightedRandom<T extends { weight?: number }>(items: T[]): T {
  const weights = items.map((item) => item.weight ?? 1)
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let roll = Math.random() * totalWeight

  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]
    if (roll <= 0) {
      return items[i]
    }
  }

  return items[items.length - 1]
}
