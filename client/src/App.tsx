import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { AudienceLayout } from './interfaces/audience/AudienceLayout'
import { AdminLayout } from './interfaces/admin/AdminLayout'
import { PresentationLayout } from './interfaces/presentation/PresentationLayout'

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
    <Routes>
      <Route path="/*" element={<AudienceLayout />} />
      <Route path="/admin/*" element={<ProtectedAdmin />} />
      <Route path="/presentation" element={<PresentationLayout />} />
    </Routes>
  )
}
