const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export type AllowedImageType = (typeof ALLOWED_TYPES)[number]

export function isValidImageType(mimeType: string): boolean {
  return ALLOWED_TYPES.includes(mimeType as AllowedImageType)
}

export function isValidImageExtension(filename: string): boolean {
  const ext = '.' + filename.split('.').pop()?.toLowerCase()
  return ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])
}

export function isValidImageFile(file: File): boolean {
  return isValidImageType(file.type) && isValidImageExtension(file.name)
}

export function isFileSizeValid(file: File, maxBytes: number = MAX_FILE_SIZE): boolean {
  return file.size <= maxBytes
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export const ALLOWED_TYPES_LIST = ALLOWED_TYPES.join(', ')
export const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / (1024 * 1024)
