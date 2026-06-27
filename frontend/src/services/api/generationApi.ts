import apiClient from './client'

/** 上传图片到后端，返回文件 URL */
export async function uploadImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/generations/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })

  const body = response.data
  if (body.code !== 200) {
    throw new Error(body.message || 'Upload failed')
  }

  return body.data as UploadResult
}

/** 生成像素风桌宠 */
export async function generatePixelArt(params: {
  file_url: string
  pixel_size?: number
  style?: string
}): Promise<GenerateResult> {
  const response = await apiClient.post('/generations/create', {
    file_url: params.file_url,
    pixel_size: params.pixel_size ?? 32,
    style: params.style ?? 'pixel_art',
  })

  const body = response.data
  if (body.code !== 200) {
    throw new Error(body.message || 'Generation failed')
  }

  return body.data as GenerateResult
}

/** 获取生成进度 */
export async function getGeneration(jobId: string): Promise<GenerationStatus> {
  const response = await apiClient.get('/generations/' + jobId)
  return response.data.data as GenerationStatus
}

// ── Types ────────────────────────────────────────────────────

export interface UploadResult {
  file_url: string
  preview_url: string
  original_name: string
  file_size: number
  mime_type: string
  width: number
  height: number
  thumbnails: Record<string, string>
}

export interface GenerateResult {
  job_id: string
  status: string
  generated_image_url: string
  preview_url: string
  pixel_size: number
  provider: string
  model: string
  analysis_text: string
}

export interface GenerationStatus {
  id: string
  status: string
  progress: number
}

