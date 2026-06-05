export interface ChatMessage {
  id: string
  petId: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface ChatSession {
  id: string
  petId: string
  title: string
  messageCount: number
  lastMessageAt: string
  createdAt: string
}

export interface SendMessageRequest {
  content: string
}
