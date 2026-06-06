import React, { useEffect, useRef } from 'react'
import { PetRenderer } from '../pixi/PetRenderer'

/**
 * PetOverlayLayout — 桌宠覆盖层
 *
 * 在 200x200 透明 Electron 窗口中渲染 PixiJS 桌宠。
 * 不使用 MainLayout（无导航栏/侧栏）。
 * 完全独立，不与主界面路由共享。
 */

export default function PetOverlayLayout() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<PetRenderer | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let mounted = true

    async function initPet() {
      const renderer = new PetRenderer({
        frameWidth: 32,
        frameHeight: 32,
        totalFrames: 16,
        scale: 3,
        initialXFraction: 0.5,
        initialYFraction: 0.5,
        animationSpeed: 1.0,
        backgroundColor: 0x000000,
        draggable: true,
        autoWalk: true,
      })

      if (!mounted) return
      rendererRef.current = renderer

      // 挂载到容器（PixiJS 会自动添加 canvas）
      await renderer.initialize(container!)

      if (!mounted) {
        renderer.destroy()
        return
      }

      // ── IPC 事件监听 ────────────────────────────────────
      const api = window.electronAPI
      if (api) {
        api.on('pet-state-change', (_state: string) => {
          // 主进程通知状态变化时响应
        })
      }
    }

    initPet()

    return () => {
      mounted = false
      rendererRef.current?.destroy()
      rendererRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      id="pet-overlay"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'transparent',
      }}
    />
  )
}
