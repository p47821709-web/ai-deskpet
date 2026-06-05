import React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { cn } from '@/utils/cn'

export const ToastProvider = ToastPrimitive.Provider
export const ToastViewport = React.forwardRef<HTMLDivElement, ToastPrimitive.ToastViewportProps>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport ref={ref} className={cn('fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[420px]', className)} {...props} />
))
ToastViewport.displayName = 'ToastViewport'
export const Toast = React.forwardRef<HTMLDivElement, ToastPrimitive.ToastProps>(({ className, ...props }, ref) => (
  <ToastPrimitive.Root ref={ref} className={cn('group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full', className)} {...props} />
))
Toast.displayName = 'Toast'
