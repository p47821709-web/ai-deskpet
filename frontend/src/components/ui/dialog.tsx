import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/utils/cn'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export const DialogContent = React.forwardRef<HTMLDivElement, DialogPrimitive.DialogContentProps>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className='fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out' />
    <DialogPrimitive.Content ref={ref} className={cn('fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg', className)} {...props}>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = 'DialogContent'
