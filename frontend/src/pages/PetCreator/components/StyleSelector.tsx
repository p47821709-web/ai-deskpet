import React from 'react'

interface StyleSelectorProps {
  value?: string
  onChange?: (style: string) => void
}

export default function StyleSelector({ value, onChange }: StyleSelectorProps) {
  return <div>StyleSelector: {value || 'default'}</div>
}
