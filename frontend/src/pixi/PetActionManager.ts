import * as PIXI from 'pixi.js'
import { PetState, PetStateType, type PetAction } from './PetState'

// ── Types ────────────────────────────────────────────────────

export interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  lastX: number
  lastY: number
  velocityX: number
  velocityY: number
}

export type InteractionType = 'click' | 'double_click' | 'drag_start' | 'drag_end' | 'hover_enter' | 'hover_leave'

export type InteractionListener = (
  type: InteractionType,
  x: number,
  y: number,
) => void

export interface ActionManagerConfig {
  /** Maximum distance in pixels for a click (not a drag) */
  clickThreshold: number
  /** Maximum time in ms for a click (not a drag) */
  clickTimeThreshold: number
  /** Double-click interval in ms */
  doubleClickInterval: number
  /** Radius in pixels for proximity detection */
  proximityRadius: number
  /** Deceleration factor for drag throw (0-1, lower = more friction) */
  dragDeceleration: number
}

const DEFAULT_CONFIG: ActionManagerConfig = {
  clickThreshold: 8,
  clickTimeThreshold: 300,
  doubleClickInterval: 400,
  proximityRadius: 100,
  dragDeceleration: 0.92,
}

// ── PetActionManager ────────────────────────────────────────

export class PetActionManager {
  private _app: PIXI.Application
  private _state: PetState
  private _sprite: PIXI.Container
  private _config: ActionManagerConfig

  private _drag: DragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    lastX: 0,
    lastY: 0,
    velocityX: 0,
    velocityY: 0,
  }

  private _clickTimer: number = 0
  private _clickCount: number = 0
  private _lastClickTime: number = 0
  private _lastPointerPos: { x: number; y: number } = { x: 0, y: 0 }
  private _interactionListeners: Set<InteractionListener> = new Set()
  private _isHovering: boolean = false
  private _proximityCheckInterval: ReturnType<typeof setInterval> | null = null

  /** Callback to notify the renderer of position changes */
  onPositionChange: ((x: number, y: number, velocityX: number, velocityY: number) => void) | null = null

  constructor(
    app: PIXI.Application,
    state: PetState,
    sprite: PIXI.Container,
    config: Partial<ActionManagerConfig> = {},
  ) {
    this._app = app
    this._state = state
    this._sprite = sprite
    this._config = { ...DEFAULT_CONFIG, ...config }

    this._setupInteraction()
    this._startProximityDetection()
  }

  // ── Public API ─────────────────────────────────────────────

  get isDragging(): boolean {
    return this._drag.isDragging
  }

  get dragVelocity(): { x: number; y: number } {
    return { x: this._drag.velocityX, y: this._drag.velocityY }
  }

  get lastPointerPosition(): { x: number; y: number } {
    return { ...this._lastPointerPos }
  }

  onInteraction(listener: InteractionListener): () => void {
    this._interactionListeners.add(listener)
    return () => this._interactionListeners.delete(listener)
  }

  /** Update drag physics. Call each frame with deltaMs. */
  update(deltaMs: number): void {
    if (!this._drag.isDragging && this._state.current === 'standing') {
      // Apply friction to remaining velocity (for throw effect)
      this._drag.velocityX *= this._config.dragDeceleration
      this._drag.velocityY *= this._config.dragDeceleration

      // If velocity is significant, simulate movement
      const speed = Math.sqrt(
        this._drag.velocityX ** 2 + this._drag.velocityY ** 2,
      )
      if (speed > 1) {
        this._sprite.x += this._drag.velocityX * (deltaMs / 16)
        this._sprite.y += this._drag.velocityY * (deltaMs / 16)
        this._clampPosition()
        this.onPositionChange?.(this._sprite.x, this._sprite.y, this._drag.velocityX, this._drag.velocityY)
      } else {
        this._drag.velocityX = 0
        this._drag.velocityY = 0
      }
    }
  }

  /** Handle mouse hover proximity — triggers 'follow' state. */
  private _startProximityDetection(): void {
    this._proximityCheckInterval = setInterval(() => {
      if (this._state.isAsleep || this._state.current === 'dragging') return

      const dx = this._lastPointerPos.x - this._sprite.x
      const dy = this._lastPointerPos.y - this._sprite.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      const wasHovering = this._isHovering
      this._isHovering = dist < this._config.proximityRadius

      if (this._isHovering && !wasHovering) {
        this._emit('hover_enter', this._lastPointerPos.x, this._lastPointerPos.y)
      } else if (!this._isHovering && wasHovering) {
        this._emit('hover_leave', this._lastPointerPos.x, this._lastPointerPos.y)
      }
    }, 200)
  }

  /** Clamp pet position within the application bounds. */
  private _clampPosition(): void {
    const margin = 0
    this._sprite.x = Math.max(
      margin,
      Math.min(this._app.screen.width - margin, this._sprite.x),
    )
    this._sprite.y = Math.max(
      margin,
      Math.min(this._app.screen.height - margin, this._sprite.y),
    )
  }

  // ── Interaction setup ─────────────────────────────────────

  private _setupInteraction(): void {
    const stage = this._app.stage
    stage.eventMode = 'static'
    stage.hitArea = this._app.screen

    // ── Pointer / Touch down ──
    stage.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      const pos = event.global
      this._lastPointerPos = { x: pos.x, y: pos.y }
      this._drag.startX = pos.x
      this._drag.startY = pos.y
      this._drag.offsetX = pos.x - this._sprite.x
      this._drag.offsetY = pos.y - this._sprite.y
      this._drag.lastX = pos.x
      this._drag.lastY = pos.y
      this._drag.velocityX = 0
      this._drag.velocityY = 0
      this._clickTimer = Date.now()

      // Check if pointer is on the pet (approximate hit test)
      const isOnPet = this._isPointerOnPet(pos.x, pos.y)

      if (isOnPet) {
        this._state.transition('drag_start', 'pointer_down')
        this._drag.isDragging = true
        this._emit('drag_start', pos.x, pos.y)
      }
    })

    // ── Pointer / Touch move ──
    stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
      const pos = event.global
      this._lastPointerPos = { x: pos.x, y: pos.y }

      if (this._drag.isDragging) {
        const dt = Math.max(1, Date.now() - (this._clickTimer || Date.now()))
        this._drag.velocityX = (pos.x - this._drag.lastX) / dt * 16
        this._drag.velocityY = (pos.y - this._drag.lastY) / dt * 16

        this._sprite.x = pos.x - this._drag.offsetX
        this._sprite.y = pos.y - this._drag.offsetY
        this._clampPosition()
        this._drag.lastX = pos.x
        this._drag.lastY = pos.y

        this.onPositionChange?.(this._sprite.x, this._sprite.y, this._drag.velocityX, this._drag.velocityY)
      }
    })

    // ── Pointer / Touch up ──
    stage.on('pointerup', (event: PIXI.FederatedPointerEvent) => {
      const pos = event.global
      const dragDist = Math.sqrt(
        (pos.x - this._drag.startX) ** 2 + (pos.y - this._drag.startY) ** 2,
      )
      const dragTime = Date.now() - this._clickTimer

      if (this._drag.isDragging) {
        this._state.transition('drag_end', 'pointer_up')
        this._drag.isDragging = false
        this._emit('drag_end', pos.x, pos.y)
      }

      // Click detection: short press, small movement
      if (dragDist < this._config.clickThreshold && dragTime < this._config.clickTimeThreshold) {
        const now = Date.now()
        if (now - this._lastClickTime < this._config.doubleClickInterval) {
          this._clickCount++
        } else {
          this._clickCount = 1
        }
        this._lastClickTime = now

        if (this._clickCount >= 2) {
          // Double-click
          this._clickCount = 0
          this._state.transition('interact', 'double_click')
          this._emit('double_click', pos.x, pos.y)
        } else if (this._isPointerOnPet(pos.x, pos.y)) {
          // Single click
          this._state.transition('interact', 'click')
          this._emit('click', pos.x, pos.y)
        }
      }
    })

    // ── Pointer leave stage ──
    stage.on('pointerleave', () => {
      if (this._drag.isDragging) {
        this._state.transition('drag_end', 'pointer_leave')
        this._drag.isDragging = false
        this._emit('drag_end', this._sprite.x, this._sprite.y)
      }
    })
  }

  // ── Hit testing ───────────────────────────────────────────

  private _isPointerOnPet(px: number, py: number): boolean {
    const bounds = this._sprite.getBounds()
    // Expand the hit area slightly for easier clicking
    const padding = 15
    return (
      px >= bounds.x - padding &&
      px <= bounds.x + bounds.width + padding &&
      py >= bounds.y - padding &&
      py <= bounds.y + bounds.height + padding
    )
  }

  // ── Event helpers ─────────────────────────────────────────

  private _emit(type: InteractionType, x: number, y: number): void {
    for (const listener of this._interactionListeners) {
      listener(type, x, y)
    }
  }

  destroy(): void {
    if (this._proximityCheckInterval) {
      clearInterval(this._proximityCheckInterval)
    }
    this._interactionListeners.clear()
    this._app.stage.removeAllListeners()
  }
}
