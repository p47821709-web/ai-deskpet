import React from 'react'
import { Dialog, DialogContent } from './ui/dialog'
import { Button } from './ui/button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
}

export default function ConfirmDialog({ open, onOpenChange, title, description, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <h2 className='text-lg font-semibold'>{title}</h2>
        <p className='text-sm text-muted-foreground'>{description}</p>
        <div className='flex justify-end gap-2 mt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>取消</Button>
          <Button variant='destructive' onClick={onConfirm}>确认</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
