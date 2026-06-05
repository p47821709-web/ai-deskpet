import { create } from 'zustand'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface ChatState {
  activeSessionId: string | null
  messages: ChatMessage[]
  isStreaming: boolean
  currentChunk: string
  inputValue: string
  setActiveSession: (id: string | null) => void
  addMessage: (msg: ChatMessage) => void
  setStreaming: (v: boolean) => void
  setCurrentChunk: (v: string) => void
  setInputValue: (v: string) => void
}

export const useChatStore = create<ChatState>((set) => ({
  activeSessionId: null,
  messages: [],
  isStreaming: false,
  currentChunk: '',
  inputValue: '',
  setActiveSession: (id) => set({ activeSessionId: id }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setStreaming: (v) => set({ isStreaming: v }),
  setCurrentChunk: (v) => set({ currentChunk: v }),
  setInputValue: (v) => set({ inputValue: v }),
}))
