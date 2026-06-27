export interface AIModelConfig {
  id: string
  provider: string
  modelName: string
  apiBase: string
  isActive: boolean
  maxTokens: number
  temperature: number
}
