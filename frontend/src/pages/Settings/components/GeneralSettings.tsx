import React from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/stores/useSettingsStore'

export default function GeneralSettings() {
  const display = useSettingsStore((s) => s.display)
  const system = useSettingsStore((s) => s.system)
  const updateDisplay = useSettingsStore((s) => s.updateDisplay)
  const updateSystem = useSettingsStore((s) => s.updateSystem)
  const resetAll = useSettingsStore((s) => s.resetAll)

  return (
    <div className="space-y-8">
      {/* Display */}
      <section>
        <h3 className="text-sm font-semibold mb-4">显示</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">窗口置顶</p>
              <p className="text-xs text-muted-foreground">桌宠窗口始终保持在其他窗口上方</p>
            </div>
            <Switch
              checked={system.alwaysOnTop}
              onCheckedChange={(v) => updateSystem({ alwaysOnTop: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">自动行走</p>
              <p className="text-xs text-muted-foreground">桌宠会在桌面上自动漫游</p>
            </div>
            <Switch
              checked={display.autoWalk}
              onCheckedChange={(v) => updateDisplay({ autoWalk: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">音效</p>
              <p className="text-xs text-muted-foreground">桌宠互动音效开关</p>
            </div>
            <Switch
              checked={display.soundEnabled}
              onCheckedChange={(v) => updateDisplay({ soundEnabled: v })}
            />
          </div>

          {/* Opacity slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">透明度</p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(display.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              value={Math.round(display.opacity * 100)}
              onChange={(e) => updateDisplay({ opacity: Number(e.target.value) / 100 })}
              className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
        </div>
      </section>

      {/* System */}
      <section>
        <h3 className="text-sm font-semibold mb-4">系统</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">开机自启</p>
              <p className="text-xs text-muted-foreground">系统启动时自动运行桌宠</p>
            </div>
            <Switch
              checked={system.autoLaunch}
              onCheckedChange={(v) => updateSystem({ autoLaunch: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">长期记忆</p>
              <p className="text-xs text-muted-foreground">桌宠会记住你和它的对话</p>
            </div>
            <Switch
              checked={system.memoryEnabled}
              onCheckedChange={(v) => updateSystem({ memoryEnabled: v })}
            />
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="pt-4 border-t border-border">
        <h3 className="text-sm font-semibold text-destructive mb-2">数据管理</h3>
        <p className="text-xs text-muted-foreground mb-3">
          重置所有设置为默认值，此操作不可撤销
        </p>
        <Button variant="destructive" size="sm" onClick={resetAll}>
          重置所有设置
        </Button>
      </section>
    </div>
  )
}
