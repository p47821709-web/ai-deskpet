
export type PetAction =
  | 'stand'
  | 'walk'
  | 'sleep'
  | 'wake'
  | 'drag_start'
  | 'drag_end'
  | 'interact'
  | 'tickle'
  | 'follow'
  | 'stop_follow'

export type PetStateType =
  | 'standing'
  | 'walking'
  | 'sleeping'
  | 'dragging'
  | 'interacting'
  | 'following'

export interface PetStateConfig {
  /** Duration in ms before auto-transition from standing to walking */
  idleToWalkInterval: [number, number]
  /** Duration in ms before auto-transition from walking back to standing */
  walkDuration: [number, number]
  /** Hour (0-23) when pet auto-sleeps */
  sleepHourStart: number
  /** Hour (0-23) when pet auto-wakes */
  sleepHourEnd: number
  /** Walking speed in pixels per second */
  walkSpeed: number
  /** Radius in pixels for follow behavior */
  followRadius: number
}

const DEFAULT_CONFIG: PetStateConfig = {
  idleToWalkInterval: [3000, 8000],
  walkDuration: [2000, 5000],
  sleepHourStart: 23,
  sleepHourEnd: 7,
  walkSpeed: 60,
  followRadius: 80,
}

export type StateChangeListener = (
  from: PetStateType,
  to: PetStateType,
  reason?: string,
) => void

export type ActionRequestListener = (action: PetAction) => void

export class PetState {
  private _current: PetStateType = 'standing'
  private _previous: PetStateType = 'standing'
  private _config: PetStateConfig
  private _enabled: boolean = true

  /** Target position for walking (absolute screen coords) */
  walkTarget: { x: number; y: number } | null = null
  /** Current walk velocity (computed each frame) */
  walkVelocity: { x: number; y: number } = { x: 0, y: 0 }

  private _stateTime: number = 0
  private _nextTransitionAt: number = 0
  private _idleTimer: ReturnType<typeof setTimeout> | null = null
  private _listeners: Set<StateChangeListener> = new Set()
  private _actionListeners: Set<ActionRequestListener> = new Set()

  constructor(config: Partial<PetStateConfig> = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config }
    this._scheduleNextIdleTransition()
  }

  // ── Public API ──────────────────────────────────────────────

  get current(): PetStateType {
    return this._current
  }

  get previous(): PetStateType {
    return this._previous
  }

  get config(): PetStateConfig {
    return this._config
  }

  get isAsleep(): boolean {
    return this._current === 'sleeping'
  }

  get isDragging(): boolean {
    return this._current === 'dragging'
  }

  get isIdle(): boolean {
    return this._current === 'standing'
  }

  get isMoving(): boolean {
    return this._current === 'walking' || this._current === 'following'
  }

  get isInteractive(): boolean {
    return this._current !== 'sleeping'
  }

  get stateElapsed(): number {
    return this._stateTime
  }

  /** Enable or disable the state machine. When disabled, the pet freezes. */
  set enabled(v: boolean) {
    this._enabled = v
    if (!v) this._clearIdleTimer()
    else this._scheduleNextIdleTransition()
  }

  get enabled(): boolean {
    return this._enabled
  }

  // ── State transitions ──────────────────────────────────────

  transition(action: PetAction, reason?: string): boolean {
    if (!this._enabled && action !== 'wake') return false

    const allowed = this._allowedTransitions(action)
    if (!allowed) return false

    this._previous = this._current
    this._current = allowed
    this._stateTime = 0
    this._clearIdleTimer()

    // Notify listeners
    for (const listener of this._listeners) {
      listener(this._previous, this._current, reason)
    }

    // Schedule next auto-transition where applicable
    if (this._current === 'standing') {
      this._scheduleNextIdleTransition()
    }

    return true
  }

  /** Force a state without checking transition rules (for initialization). */
  force(state: PetStateType): void {
    this._previous = this._current
    this._current = state
    this._stateTime = 0
    this._clearIdleTimer()
    for (const listener of this._listeners) {
      listener(this._previous, this._current, 'forced')
    }
  }

  /** Tick the state machine. Call every animation frame. */
  tick(deltaMs: number): void {
    if (!this._enabled) return
    this._stateTime += deltaMs

    // Auto-walk timeout: if walking too long, return to standing
    if (this._current === 'walking' && this._stateTime >= this._nextTransitionAt) {
      this.transition('stand', 'walk_timeout')
      this.walkTarget = null
    }
  }

  // ── Event subscription ─────────────────────────────────────

  onStateChange(listener: StateChangeListener): () => void {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  onActionRequest(listener: ActionRequestListener): () => void {
    this._actionListeners.add(listener)
    return () => this._actionListeners.delete(listener)
  }

  destroy(): void {
    this._clearIdleTimer()
    this._listeners.clear()
    this._actionListeners.clear()
  }

  // ── Transition matrix ──────────────────────────────────────

  private _allowedTransitions(action: PetAction): PetStateType | null {
    const matrix: Record<PetStateType, Partial<Record<PetAction, PetStateType>>> = {
      standing: {
        stand: 'standing',
        walk: 'walking',
        sleep: 'sleeping',
        drag_start: 'dragging',
        interact: 'interacting',
        follow: 'following',
      },
      walking: {
        stand: 'standing',
        walk: 'walking',
        sleep: 'sleeping',
        drag_start: 'dragging',
        interact: 'interacting',
        follow: 'following',
      },
      sleeping: {
        wake: 'standing',
        drag_start: 'dragging',
      },
      dragging: {
        drag_end: 'standing',
        interact: 'interacting',
      },
      interacting: {
        stand: 'standing',
        walk: 'walking',
        sleep: 'sleeping',
        drag_start: 'dragging',
        follow: 'following',
      },
      following: {
        stand: 'standing',
        walk: 'walking',
        stop_follow: 'standing',
        drag_start: 'dragging',
        sleep: 'sleeping',
        interact: 'interacting',
      },
    }
    return matrix[this._current]?.[action] ?? null
  }

  private _scheduleNextIdleTransition(): void {
    this._clearIdleTimer()
    const [min, max] = this._config.idleToWalkInterval
    const delay = min + Math.random() * (max - min)
    this._idleTimer = setTimeout(() => {
      if (this._current === 'standing' && this._enabled) {
        this.transition('walk', 'auto_idle_timeout')
        // Set a random walk target
        const [walkMin, walkMax] = this._config.walkDuration
        this._nextTransitionAt = walkMin + Math.random() * (walkMax - walkMin)
      }
    }, delay)
  }

  private _clearIdleTimer(): void {
    if (this._idleTimer !== null) {
      clearTimeout(this._idleTimer)
      this._idleTimer = null
    }
  }
}
