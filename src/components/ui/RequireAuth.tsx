import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)
  const isLoading  = useAuthStore(s => s.isLoading)
  const location   = useLocation()
  if (isLoading) return <div className="min-h-screen bg-px-base" />
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}
