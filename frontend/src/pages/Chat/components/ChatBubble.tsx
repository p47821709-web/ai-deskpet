import React from 'react'
import { cn } from '../../../utils/cn'

interface ChatBubbleProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  emotion?: string
  timestamp?: number
  isStreaming?: boolean
}

export default function ChatBubble({
  role,
  content,
  emotion,
  timestamp,
  isStreaming = false,
}: ChatBubbleProps) {
  const isUser = role === 'user'
  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : ''

  // Render emoji for assistant messages
  const emotionEmoji = emotionToEmoji(emotion)

  return (
    <div
      className={cn(
        'flex items-start gap-2 max-w-[85%]',
        isUser ? 'ml-auto flex-row-reverse' : '',
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-primary/10',
        )}
      >
        {isUser ? '👤' : '🐾'}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm',
          isStreaming ? 'border border-primary/20' : '',
        )}
      >
        {/* Emotion tag */}
        {!isUser && emotion && !isStreaming && (
          <span className="block text-[11px] text-muted-foreground/60 mb-1">
            {emotionEmoji} {emotion}
          </span>
        )}

        {/* Message content */}
        <div className="whitespace-pre-wrap">
          {renderContent(content, isStreaming)}
        </div>

        {/* Timestamp */}
        {timeStr && !isStreaming && (
          <span
            className={cn(
              'block text-[10px] mt-1.5',
              isUser ? 'text-primary-foreground/60' : 'text-muted-foreground/50',
            )}
          >
            {timeStr}
          </span>
        )}

        {/* Streaming cursor */}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse align-text-bottom" />
        )}
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────

function renderContent(content: string, isStreaming: boolean): React.ReactNode {
  // Split by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g)
  if (parts.length === 1) {
    return content
  }
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const code = part.replace(/```\w*\n?/, '').replace(/```$/, '')
      return (
        <code
          key={i}
          className="block bg-background rounded-md px-3 py-2 my-2 text-xs font-mono overflow-x-auto"
        >
          {code}
        </code>
      )
    }
    return <span key={i}>{part}</span>
  })
}

const EMOTION_EMOJI: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😤',
  surprised: '😮',
  tired: '😴',
  excited: '🤩',
  confused: '😕',
  neutral: '😐',
}

function emotionToEmoji(emotion?: string): string {
  if (!emotion) return ''
  return EMOTION_EMOJI[emotion.toLowerCase()] || ''
}
