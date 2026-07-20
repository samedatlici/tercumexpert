import { RouterProvider } from 'react-router-dom'
import { RootErrorBoundary } from './RootErrorBoundary'
import { AppProviders } from './providers/AppProviders'
import { router } from './router/router'

export function App() {
  return (
    <RootErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </RootErrorBoundary>
  )
}
