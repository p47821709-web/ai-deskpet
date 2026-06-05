export interface Pet {
  id: string
  userId: string
  name: string
  species: string
  personality: string
  sourceImageUrl: string
  spriteSheetUrl: string
  portraitUrl: string
  colorPalette: string[]
  pixelSize: number
  scale: number
  xPosition: number
  yPosition: number
  status: 'active' | 'inactive' | 'archived'
  affectionLevel: number
  energyLevel: number
  moodScore: number
  lastEmotion: string
  createdAt: string
  updatedAt: string
  lastActiveAt: string
}

export interface CreatePetRequest {
  name: string
  species?: string
  personality?: string
}

export interface UpdatePetRequest {
  name?: string
  species?: string
  personality?: string
}
