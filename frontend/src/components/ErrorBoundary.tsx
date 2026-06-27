import React from 'react'

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return <div className='flex items-center justify-center h-screen'><p>应用出现错误，请刷新重试。</p></div>
    return this.props.children
  }
}
