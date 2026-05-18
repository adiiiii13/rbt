import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-slate-50">
          <h1 className="text-4xl font-bold text-slate-800">Something broke</h1>
          <p className="mt-3 text-slate-600 max-w-md">
            Unexpected error. Try reload. If problem stays, contact support.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 max-w-2xl text-left text-xs bg-red-50 text-red-800 p-3 rounded overflow-auto">
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="mt-6 px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
