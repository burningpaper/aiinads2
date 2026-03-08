import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { AudienceLayout } from './interfaces/audience/AudienceLayout'
import { AdminLayout } from './interfaces/admin/AdminLayout'
import { PresentationLayout } from './interfaces/presentation/PresentationLayout'
import { ErrorBoundary, PresentationErrorFallback } from './components/ErrorBoundary'
import { ConnectionToast } from './components/ConnectionToast'

function ProtectedAdmin() {
  return (
    <>
      <SignedIn>
        <AdminLayout />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ConnectionToast />
      <Routes>
        <Route path="/*" element={
          <ErrorBoundary>
            <AudienceLayout />
          </ErrorBoundary>
        } />
        <Route path="/admin/*" element={
          <ErrorBoundary>
            <ProtectedAdmin />
          </ErrorBoundary>
        } />
        <Route path="/presentation" element={
          <ErrorBoundary fallback={<PresentationErrorFallback />}>
            <PresentationLayout />
          </ErrorBoundary>
        } />
      </Routes>
    </ErrorBoundary>
  )
}
