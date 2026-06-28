import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { usePetStore } from '@/stores/usePetStore'

export default function PetList() {
  const navigate = useNavigate()
  const pets = usePetStore((s) => s.pets)

  if (pets.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">我的桌宠</h1>
            <p className="text-sm text-muted-foreground mt-1">管理你所有的像素风桌宠</p>
          </div>
          <Button onClick={() => navigate('/create')}>
            ✨ 新建桌宠
          </Button>
        </div>

        <Card className="py-16">
          <CardContent className="text-center space-y-4">
            <div className="text-6xl">🐱</div>
            <div>
              <p className="text-lg font-medium">还没有桌宠</p>
              <p className="text-sm text-muted-foreground">点击下方按钮创建你的第一个 AI 桌宠吧！</p>
            </div>
            <Button onClick={() => navigate('/create')}>创建桌宠</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">我的桌宠</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {pets.length} 只桌宠
          </p>
        </div>
        <Button onClick={() => navigate('/create')}>
          ✨ 新建桌宠
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <Card
            key={pet.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/pets/${pet.id}`)}
          >
            <CardContent className="pt-6 space-y-4">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {pet.imageUrl ? (
                  <img
                    src={pet.imageUrl}
                    alt={pet.name}
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span className="text-4xl">🐾</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{pet.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pet.style} · {pet.pixelSize}px
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  互动 {pet.interactions} 次 · {pet.createdAt}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/chat/${pet.id}`)
                  }}
                >
                  💬 聊天
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}