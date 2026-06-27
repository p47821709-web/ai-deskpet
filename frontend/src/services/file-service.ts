const API_BASE = 'http://localhost:8000/api/v1'

export interface UploadResult {
  fileUrl: string
  previewUrl: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percent: number
}

export const fileService = {
  async upload(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('file', file)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded / event.total) * 100),
          })
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve({
              fileUrl: response.data.file_url,
              previewUrl: response.data.preview_url || response.data.file_url,
            })
          } catch {
            reject(new Error('Failed to parse server response'))
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.message || 'Upload failed'))
          } catch {
            reject(new Error('Upload failed with status ' + xhr.status))
          }
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred during upload'))
      })

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'))
      })

      xhr.open('POST', API_BASE + '/generations/upload')
      const deviceId = localStorage.getItem('device_id')
      if (deviceId) {
        xhr.setRequestHeader('X-Device-Id', deviceId)
      }
      xhr.send(formData)
    })
  },

  createObjectURL(file: File): string {
    return URL.createObjectURL(file)
  },

  revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url)
  },
}
