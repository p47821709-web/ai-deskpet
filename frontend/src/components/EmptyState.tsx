import React from 'react'
export default function EmptyState({ title, description }: { title: string; description?: string }) {
  return <div className='flex flex-col items-center justify-center py-16'><h3 className='text-lg font-medium'>{title}</h3>{description && <p className='text-sm text-muted-foreground mt-1'>{description}</p>}</div>
}
