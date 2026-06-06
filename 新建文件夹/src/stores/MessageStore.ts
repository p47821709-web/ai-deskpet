import { create } from 'zustand'

// ── Types ────────────────────────────────────────────────────

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  emotion?: string
  timestamp: number
}

export interface StreamChunk {
  type: 'text' | 'emotion' | 'done' | 'error'
  content: string
}

export interface MessageStoreState {
  /** All messages in the current session */
  messages: Message[]
  /** True while the AI is generating a response */
  isStreaming: boolean
  /** Content being streamed in real-time (not yet committed) */
  streamingContent: string
  /** Current AI emotion detected during streaming */
  currentEmotion: string
  /** Error message, if any */
  error: string | null
  /** Session ID for backend persistence */
  sessionId: string | null

  // ── Actions ──
  addMessage: (message: Message) => void
  /** Append a chunk to the currently streaming assistant message */
  appendToStreaming: (chunk: string) => void
  /** Set the emotion from the current streaming message */
  updateEmotion: (emotion: string) => void
  /** Finalize the streaming message and add it to the message list */
  finalizeStreaming: () => void
  setStreaming: (value: boolean) => void
  setError: (error: string | null) => void
  setSessionId: (id: string | null) => void
  clearMessages: () => void
  /** Remove all messages from a specific role */
  clearRole: (role: 'user' | 'assistant') => void
}

// ── Helpers ──────────────────────────────────────────────────

let _messageCounter = 0

function nextId(): string {
  _messageCounter++
  return `msg_${Date.now()}_${_messageCounter}`
}

// ── Store ────────────────────────────────────────────────────

export const useMessageStore = create<MessageStoreState>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  currentEmotion: 'neutral',
  error: null,
  sessionId: null,

  addMessage: (message: Message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, id: message.id || nextId() }],
    })),

  appendToStreaming: (chunk: string) =>
    set((state) => ({
      streamingContent: state.streamingContent + chunk,
    })),

  updateEmotion: (emotion: string) =>
    set({ currentEmotion: emotion }),

  finalizeStreaming: () =>
    set((state) => {
      if (!state.streamingContent) {
        return { isStreaming: false, streamingContent: '' }
      }
      const newMessage: Message = {
        id: nextId(),
        role: 'assistant',
        content: state.streamingContent,
        emotion: state.currentEmotion,
        timestamp: Date.now(),
      }
      return {
        messages: [...state.messages, newMessage],
        streamingContent: '',
        isStreaming: false,
        currentEmotion: 'neutral',
      }
    }),

  setStreaming: (value: boolean) =>
    set({ isStreaming: value }),

  setError: (error: string | null) =>
    set({ error }),

  setSessionId: (id: string | null) =>
    set({ sessionId: id }),

  clearMessages: () =>
    set({
      messages: [],
      streamingContent: '',
      currentEmotion: 'neutral',
      error: null,
    }),

  clearRole: (role: 'user' | 'assistant') =>
    set((state) => ({
      messages: state.messages.filter((m) => m.role !== role),
    })),
}))
