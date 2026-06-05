import React from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useSettingsStore } from '@/stores/useSettingsStore'

export default function PetBehavior() {
  const pet = useSettingsStore((s) => s.pet)
  const display = useSettingsStore((s) => s.display)
  const updatePet = useSettingsStore((s) => s.updatePet)
  const updateDisplay = useSettingsStore((s) => s.updateDisplay)

  return (
    <div className="space-y-8">
      {/* Identity */}
      <section>
        <h3 className="text-sm font-semibold mb-4">桌宠身份</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">桌宠名称</label>
            <Input
              value={pet.petName}
              onChange={(e) => updatePet({ petName: e.target.value })}
              placeholder="小咪"
              maxLength={20}
              className="max-w-xs"
            />
          </div>
        </div>
      </section>

      {/* Size */}
      <section>
        <h3 className="text-sm font-semibold mb-4">桌宠大小</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">缩放倍率</span>
            <span className="text-sm tabular-nums font-medium">{pet.petScale}x</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">小</span>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={pet.petScale}
              onChange={(e) => updatePet({ petScale: Number(e.target.value) })}
              className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
            />
            <span className="text-xs text-muted-foreground">大</span>
          </div>
          {/* Preview */}
          <div className="flex items-center justify-center py-6 bg-muted/20 rounded-xl border border-border">
            <div
              className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center transition-all"
              style={{ transform: `scale(${pet.petScale * 0.5})` }}
            >
              🐾
            </div>
          </div>
        </div>
      </section>

      {/* Volume */}
      <section>
        <h3 className="text-sm font-semibold mb-4">音量</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">桌宠音量</span>
            <span className="text-sm tabular-nums font-medium">{pet.petVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={pet.petVolume}
            onChange={(e) => updatePet({ petVolume: Number(e.target.value) })}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={display.soundEnabled}
                onCheckedChange={(v) => updateDisplay({ soundEnabled: v })}
              />
              <span className="text-xs text-muted-foreground">静音</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
