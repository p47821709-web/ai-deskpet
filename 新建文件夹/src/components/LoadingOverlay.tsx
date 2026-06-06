import React from 'react'
export default function LoadingOverlay() {
  return <div className='fixed inset-0 bg-black/50 flex items-center justify-center'><div className='animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full' /></div>
}
