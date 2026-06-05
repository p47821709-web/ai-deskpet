export interface Memory {
  id: string
  petId: string
  userId: string
  memoryType: 'episodic' | 'semantic' | 'procedural'
  content: string
  importance: number
  category: string
  createdAt: string
  lastRecalledAt: string
  recallCount: number
}

export interface MemorySearchResult {
  memory: Memory
  relevance: number
}
