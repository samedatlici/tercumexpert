import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

/** En üst seviye hata sınırı. (React'ta hata sınırı hâlâ class gerektirir.) */
export class RootErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Uygulama hatası:', error, info.componentStack)
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-semibold">Bir şeyler ters gitti</h1>
          <p className="text-text-secondary">Lütfen sayfayı yenileyin.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Yenile
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
