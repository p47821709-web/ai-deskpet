import { useMessageStore, type Message, type StreamChunk } from '../stores/MessageStore'

// ── Types ────────────────────────────────────────────────────

export type AIProvider = 'openai' | 'deepseek' | 'doubao'

export interface ChatServiceConfig {
  provider: AIProvider
  apiKey: string
  apiBase: string
  model: string
  systemPrompt?: string
}

export interface ChatServiceEvents {
  onChunk: (chunk: StreamChunk) => void
  onError: (error: Error) => void
  onDone: () => void
}

// ── Defaults ─────────────────────────────────────────────────

const DEFAULT_SYSTEM_PROMPT: string =
  'You are a cute pixel art desktop pet living on the user\'s computer screen. ' +
  'You have your own personality: friendly, playful, sometimes mischievous. ' +
  'Keep responses short and conversational (1-3 sentences). ' +
  'Use emoji occasionally. ' +
  'Refer to yourself as a pet and the user as your owner. ' +
  'When you feel strong emotions, include an emotion tag like [happy], [sad], [surprised], [tired], [confused].'

const PROVIDER_DEFAULTS: Record<AIProvider, { apiBase: string; model: string }> = {
  openai: {
    apiBase: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  deepseek: {
    apiBase: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  doubao: {
    apiBase: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-pro-32k',
  },
}

// ── ChatService ──────────────────────────────────────────────

export class ChatService {
  private _config: ChatServiceConfig
  private _abortController: AbortController | null = null
  private _history: Message[] = []

  constructor(config: Partial<ChatServiceConfig> = {}) {
    const provider = config.provider || 'openai'
    const defaults = PROVIDER_DEFAULTS[provider]
    this._config = {
      provider,
      apiKey: config.apiKey || '',
      apiBase: config.apiBase || defaults.apiBase,
      model: config.model || defaults.model,
      systemPrompt: config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    }
  }

  // ── Public API ─────────────────────────────────────────────

  /** Update the AI provider configuration at runtime. */
  updateConfig(partial: Partial<ChatServiceConfig>): void {
    if (partial.provider) {
      const defaults = PROVIDER_DEFAULTS[partial.provider]
      this._config.provider = partial.provider
      this._config.apiBase = partial.apiBase || defaults.apiBase
      this._config.model = partial.model || defaults.model
    }
    if (partial.apiKey !== undefined) this._config.apiKey = partial.apiKey
    if (partial.apiBase !== undefined && !partial.provider) this._config.apiBase = partial.apiBase
    if (partial.model !== undefined) this._config.model = partial.model
    if (partial.systemPrompt !== undefined) this._config.systemPrompt = partial.systemPrompt
  }

  get config(): Readonly<ChatServiceConfig> {
    return { ...this._config }
  }

  /** Load conversation history (e.g., from a previous session). */
  loadHistory(messages: Message[]): void {
    this._history = messages.filter((m) => m.role !== 'system')
  }

  /** Send a message and stream the response.
   *  Automatically updates the MessageStore. */
  async sendMessage(
    content: string,
    petId?: string,
  ): Promise<void> {
    const store = useMessageStore.getState()

    // Don't send if already streaming
    if (store.isStreaming) return

    // Add user message to store
    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    store.addMessage(userMessage)
    this._history.push(userMessage)

    // Set streaming state
    store.setStreaming(true)
    store.setError(null)

    // Create abort controller
    this._abortController = new AbortController()

    try {
      // Build messages for the API
      const apiMessages = this._buildApiMessages()

      // Stream from API
      await this._streamFromAPI(apiMessages, this._abortController.signal)

      // Finalize the streaming message
      store.finalizeStreaming()

      // Add the complete message to history
      const finalContent = useMessageStore.getState().streamingContent
      if (finalContent) {
        const assistantMessage: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: finalContent,
          emotion: useMessageStore.getState().currentEmotion,
          timestamp: Date.now(),
        }
        this._history.push(assistantMessage)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        store.finalizeStreaming()
        return
      }
      const errMsg = error.message || 'Failed to get response from AI'
      store.setError(errMsg)
      store.setStreaming(false)
    } finally {
      this._abortController = null
    }
  }

  /** Cancel the current streaming request. */
  cancelStreaming(): void {
    this._abortController?.abort()
    this._abortController = null
    const store = useMessageStore.getState()
    if (store.isStreaming) {
      // Keep what we have so far
      store.finalizeStreaming()
    }
  }

  /** Clear the internal conversation history. */
  clearHistory(): void {
    this._history = []
    useMessageStore.getState().clearMessages()
  }

  destroy(): void {
    this.cancelStreaming()
    this._history = []
  }

  // ── Internal: Build API request ───────────────────────────

  private _buildApiMessages(): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: this._config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
    ]

    // Add last N messages for context (limit to avoid token overflow)
    const contextLimit = 20
    const recentHistory = this._history.slice(-contextLimit)
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content })
    }

    return messages
  }

  // ── Internal: Stream from API ─────────────────────────────

  private async _streamFromAPI(
    messages: Array<{ role: string; content: string }>,
    signal: AbortSignal,
  ): Promise<void> {
    const { apiBase, apiKey, model } = this._config
    const store = useMessageStore.getState()

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        max_tokens: 1024,
        temperature: 0.8,
      }),
      signal,
    })

    if (!response.ok) {
      let errorBody = ''
      try {
        errorBody = await response.text()
      } catch {}
      throw new Error(
        `AI API error (${response.status}): ${errorBody || response.statusText}`,
      )
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        const parsed = this._parseSSELine(line)
        if (parsed) {
          store.appendToStreaming(parsed.content)

          // Detect emotion tags in streamed content
          if (parsed.isEmotion) {
            store.updateEmotion(parsed.content)
          }
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      const parsed = this._parseSSELine(buffer)
      if (parsed) {
        store.appendToStreaming(parsed.content)
      }
    }
  }

  // ── Internal: SSE parsing ─────────────────────────────────

  private _parseSSELine(line: string): { content: string; isEmotion: boolean } | null {
    const trimmed = line.trim()

    // Skip empty lines and SSE event markers
    if (!trimmed || trimmed.startsWith('event:') || trimmed.startsWith(':')) {
      return null
    }

    // Parse "data: ..." lines
    if (trimmed.startsWith('data:')) {
      const jsonStr = trimmed.slice(5).trim()

      // SSE stream end signal
      if (jsonStr === '[DONE]') return null

      try {
        const json = JSON.parse(jsonStr)
        const content = json?.choices?.[0]?.delta?.content || ''
        if (!content) return null

        // Check for emotion tags like [happy], [sad]
        const emotionMatch = content.match(/\[(happy|sad|angry|surprised|tired|excited|confused|neutral)\]/i)
        if (emotionMatch) {
          return { content: content.replace(/\[.*?\]/g, '').trim(), isEmotion: true }
        }

        return { content, isEmotion: false }
      } catch {
        // Not JSON — might be a plain text streaming format
        return { content: jsonStr, isEmotion: false }
      }
    }

    return null
  }
}
