import React, { useCallback, useRef, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ChatWindow from './components/ChatWindow'
import MemoryPanel from './components/MemoryPanel'
import { ChatService } from '../../services/ChatService'
import { useMessageStore } from '../../stores/MessageStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

// ── Chat Page ────────────────────────────────────────────────

export default function ChatPage() {
  const { petId: routePetId } = useParams<{ petId: string }>()
  const [petId] = useState<string>(routePetId || 'default')
  const [petName] = useState<string>('小咪')
  const [showMemory, setShowMemory] = useState(false)
  const chatServiceRef = useRef<ChatService | null>(null)
  const store = useMessageStore()

  // 从 SettingsStore 读取 AI 配置
  const aiProvider = useSettingsStore((s) => s.ai.aiProvider)
  const aiApiKey = useSettingsStore((s) => s.ai.aiApiKey)
  const aiApiBase = useSettingsStore((s) => s.ai.aiApiBase)
  const aiModel = useSettingsStore((s) => s.ai.aiModel)

  // Initialize ChatService once with settings from store
  useEffect(() => {
    if (!chatServiceRef.current) {
      chatServiceRef.current = new ChatService({
        provider: (aiProvider as 'openai' | 'deepseek' | 'doubao') || 'openai',
        apiKey: aiApiKey || '',
        apiBase: aiApiBase || 'https://api.openai.com/v1',
        model: aiModel || 'gpt-4o-mini',
      })
    }

    // 当 AI 配置变化时更新 ChatService
    chatServiceRef.current.updateConfig({
      provider: (aiProvider as 'openai' | 'deepseek' | 'doubao') || 'openai',
      apiKey: aiApiKey || '',
      apiBase: aiApiBase || 'https://api.openai.com/v1',
      model: aiModel || 'gpt-4o-mini',
    })
  }, [petId, aiProvider, aiApiKey, aiApiBase, aiModel])

  const handleSendMessage = useCallback(
    (content: string) => {
      chatServiceRef.current?.sendMessage(content, petId)
    },
    [petId],
  )

  const handleCancel = useCallback(() => {
    chatServiceRef.current?.cancelStreaming()
  }, [])

  const handleClearChat = useCallback(() => {
    chatServiceRef.current?.clearHistory()
  }, [])

  return (
    <div className="h-full flex gap-4 p-4">
      {/* Chat Window */}
      <div className="flex-1 max-w-2xl mx-auto">
        <ChatWindow
          petId={petId}
          petName={petName}
          onSendMessage={handleSendMessage}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            >
              清空对话
            </button>
            {store.isStreaming && (
              <button
                onClick={handleCancel}
                className="text-xs text-destructive hover:text-destructive/80 transition-colors px-2 py-1 rounded-md hover:bg-destructive/10"
              >
                停止生成
              </button>
            )}
          </div>

          <button
            onClick={() => setShowMemory(!showMemory)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="3" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1" />
              <path d="M3 3V2C3 1.44772 3.44772 1 4 1H8C8.55228 1 9 1.44772 9 2V3" stroke="currentColor" strokeWidth="1" />
            </svg>
            记忆
          </button>
        </div>
      </div>

      {/* Memory Panel (sidebar) */}
      {showMemory && (
        <div className="w-72 hidden lg:block">
          <MemoryPanel petId={petId} onClose={() => setShowMemory(false)} />
        </div>
      )}
    </div>
  )
}
