import React from 'react'
import { cn } from '@/utils/cn'

interface StyleSelectorProps {
  value?: string
  onChange?: (style: string) => void
}

const STYLES = [
  {
    id: 'pixel_art',
    name: '像素风',
    desc: '经典 16-bit 像素风格',
    icon: '🟦',
  },
  {
    id: 'chibi',
    name: 'Q 版',
    desc: '可爱大头 Q 版风格',
    icon: '🧸',
  },
  {
    id: 'retro',
    name: '复古',
    desc: '8-bit 复古游戏风格',
    icon: '🕹️',
  },
  {
    id: 'watercolor',
    name: '水彩',
    desc: '柔和手绘水彩风格',
    icon: '🎨',
  },
]

export default function StyleSelector({ value = 'pixel_art', onChange }: StyleSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">生成风格</h4>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STYLES.map((style) => {
          const isActive = value === style.id
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange?.(style.id)}
              className={cn(
                'flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all',
                isActive
                  ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/20',
              )}
            >
              <span className="text-lg mt-0.5">{style.icon}</span>
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {style.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {style.desc}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
