import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="space-x-4">
              <button
                onClick={this.handleRetry}
                className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-lg font-medium"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Specific fallback for presentation screen - auto-recovery
export function PresentationErrorFallback() {
  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="font-serif text-4xl mb-4">Recovering...</h1>
        <p className="text-primary-300 mb-8">The presentation will resume shortly.</p>
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto" />
      </div>
    </div>
  )
}
