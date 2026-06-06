import React, { useRef, useEffect, useCallback } from 'react'
import { useMessageStore } from '../../../stores/MessageStore'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'
import EmotionIndicator from './EmotionIndicator'

interface ChatWindowProps {
  petId: string
  petName?: string
  onSendMessage: (content: string) => void
  onClose?: () => void
  className?: string
}

export default function ChatWindow({
  petId,
  petName = '桌宠',
  onSendMessage,
  onClose,
  className = '',
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    messages,
    isStreaming,
    streamingContent,
    currentEmotion,
    error,
  } = useMessageStore()

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  return (
    <div
      className={`flex flex-col h-full bg-background rounded-xl border border-border shadow-xl overflow-hidden ${className}`}
      data-chat-window
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm">🐾</span>
            {isStreaming && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight">{petName}</h3>
            <p className="text-[11px] text-muted-foreground">
              {isStreaming ? '输入中...' : '在线'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <EmotionIndicator emotion={currentEmotion} size="sm" />
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="关闭聊天"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth"
      >
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-3xl mb-3">👋</div>
            <p className="text-sm font-medium text-foreground">和 {petName} 打个招呼吧！</p>
            <p className="text-xs text-muted-foreground mt-1">
              桌宠会记住和你的对话
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            emotion={msg.emotion}
            timestamp={msg.timestamp}
          />
        ))}

        {/* Streaming indicator */}
        {isStreaming && streamingContent && (
          <ChatBubble
            role="assistant"
            content={streamingContent}
            isStreaming={true}
          />
        )}

        {/* Typing dots when streaming just started but no content yet */}
        {isStreaming && !streamingContent && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs">
              🐾
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 4.5V7.5M7 9V9.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-border bg-muted/20 px-4 py-3">
        <ChatInput
          onSend={onSendMessage}
          disabled={isStreaming}
          placeholder={`对 ${petName} 说话...`}
        />
      </div>
    </div>
  )
}
