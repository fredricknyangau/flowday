import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500 mb-2">Something went wrong in this section.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1 bg-emerald-600 text-white rounded text-xs"
          >
            Reload Section
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
