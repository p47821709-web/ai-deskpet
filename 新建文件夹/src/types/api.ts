export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  meta?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  size: number
  total: number
}

export interface GenerationJob {
  id: string
  userId: string
  petId?: string
  sourceImageUrl: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  result?: Record<string, any>
  errorMessage?: string
  createdAt: string
  completedAt?: string
}
