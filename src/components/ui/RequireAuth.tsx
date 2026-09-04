import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

function VerifyEmailGate() {
  return (
    <div className="arena-page arena-stage min-h-screen bg-px-base text-px-text flex items-center justify-center px-4">
      <div className="arena-panel arena-panel-yellow flex flex-col items-center gap-4 text-center px-8 py-8"
           style={{ width: 380, background: '#141726', border: '2px solid #2e3755' }}>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#ffd166' }}>VERIFY YOUR EMAIL</p>
        <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#8892b8' }}>
          You need to verify your email before you can play. Check your inbox for the verification link, or resend it from your profile.
        </p>
        <Link to="/profile" className="px-5 py-2 font-bold text-xs uppercase tracking-widest hover:brightness-110"
              style={{ background: '#c42b2b', color: '#fff', boxShadow: '3px 3px 0 #7a1a0a', fontFamily: 'monospace' }}>
          Go to Profile
        </Link>
      </div>
    </div>
  )
}

interface RequireAuthProps {
  children: React.ReactNode
  /** Also require a verified email (e.g. for match-play routes). */
  requireVerified?: boolean
}

export function RequireAuth({ children, requireVerified }: RequireAuthProps) {
  const isLoggedIn    = useAuthStore(s => s.isLoggedIn)
  const isLoading     = useAuthStore(s => s.isLoading)
  const emailVerified = useAuthStore(s => s.emailVerified)
  const location   = useLocation()
  if (isLoading) return <div className="min-h-screen bg-px-base" />
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />
  if (requireVerified && !emailVerified) return <VerifyEmailGate />
  return <>{children}</>
}
