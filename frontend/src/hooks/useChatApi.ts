import { useCallback, useState } from 'react'
import apiClient from '../services/api/client'
import type { Message } from '../stores/MessageStore'

// ── Types ────────────────────────────────────────────────────

export interface ChatSession {
  id: string
  pet_id: string
  created_at: string
  message_count: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface UseChatApiReturn {
  /** 创建新会话，返回 sessionId */
  createSession: (petId: string) => Promise<string | null>
  /** 发送消息（非流式），返回 AI 回复 */
  sendMessage: (sessionId: string, content: string) => Promise<string | null>
  /** 加载历史消息，返回 Message[] */
  fetchHistory: (sessionId: string) => Promise<Message[]>
  /** 加载中状态 */
  loading: boolean
  /** 错误信息 */
  error: string | null
}

// ── Hook ─────────────────────────────────────────────────────

export function useChatApi(): UseChatApiReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSession = useCallback(async (petId: string): Promise<string | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.post('/chat/sessions', { pet_id: petId })
      const body = res.data
      if (body.code === 200) {
        return body.data?.id || null
      }
      throw new Error(body.message || '创建会话失败')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '创建会话失败'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const sendMessage = useCallback(async (
    sessionId: string,
    content: string,
  ): Promise<string | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.post(`/chat/sessions/${sessionId}/messages`, { content })
      const body = res.data
      if (body.code === 200) {
        return body.data?.reply || body.data?.content || null
      }
      throw new Error(body.message || '发送消息失败')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '发送消息失败'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHistory = useCallback(async (sessionId: string): Promise<Message[]> => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get(`/chat/sessions/${sessionId}/messages`)
      const body = res.data
      if (body.code === 200) {
        const items: ChatMessage[] = body.data || []
        return items.map((item) => ({
          id: item.id,
          role: item.role,
          content: item.content,
          timestamp: new Date(item.created_at).getTime(),
        }))
      }
      return []
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '加载历史失败'
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return { createSession, sendMessage, fetchHistory, loading, error }
}
