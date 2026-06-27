import React from 'react'
import { cn } from '../../../utils/cn'

interface EmotionIndicatorProps {
  emotion: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const EMOTION_CONFIG: Record<
  string,
  { emoji: string; label: string; color: string }
> = {
  happy: { emoji: '😊', label: '开心', color: 'text-yellow-500' },
  sad: { emoji: '😢', label: '难过', color: 'text-blue-400' },
  angry: { emoji: '😤', label: '生气', color: 'text-red-500' },
  surprised: { emoji: '😮', label: '惊讶', color: 'text-purple-400' },
  tired: { emoji: '😴', label: '疲惫', color: 'text-gray-400' },
  excited: { emoji: '🤩', label: '兴奋', color: 'text-pink-500' },
  confused: { emoji: '😕', label: '困惑', color: 'text-orange-400' },
  neutral: { emoji: '😐', label: '平静', color: 'text-muted-foreground' },
}

export default function EmotionIndicator({
  emotion,
  size = 'md',
  showLabel = false,
}: EmotionIndicatorProps) {
  const config = EMOTION_CONFIG[emotion.toLowerCase()] || EMOTION_CONFIG.neutral

  const sizeClasses = {
    sm: 'text-sm w-5 h-5',
    md: 'text-xl w-8 h-8',
    lg: 'text-3xl w-12 h-12',
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5',
        size === 'sm' ? 'gap-1' : '',
      )}
      title={config.label}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-all duration-300',
          sizeClasses[size],
          config.color,
        )}
      >
        {config.emoji}
      </span>
      {showLabel && (
        <span className="text-xs text-muted-foreground">{config.label}</span>
      )}
    </div>
  )
}
