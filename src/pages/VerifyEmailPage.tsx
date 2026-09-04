import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API, useAuthStore } from '../store/authStore'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const setEmailVerified = useAuthStore(s => s.setEmailVerified)
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('error'); setMessage('Missing verification token.'); return }

    void fetch(`${API}/auth/verify-email`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        const data = await res.json() as { ok?: boolean; error?: string }
        if (!res.ok) throw new Error(data.error ?? 'Verification failed.')
        setEmailVerified(true)
        setStatus('success')
      })
      .catch(err => { setStatus('error'); setMessage(err instanceof Error ? err.message : 'Verification failed.') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="arena-page arena-stage min-h-screen bg-px-base text-px-text flex items-center justify-center px-4">
      <div className="arena-panel arena-panel-yellow flex flex-col items-center gap-4 text-center px-8 py-8"
           style={{ width: 380, background: '#141726', border: '2px solid #2e3755' }}>
        {status === 'checking' && (
          <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#8892b8' }}>Verifying your email…</p>
        )}
        {status === 'success' && (
          <>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#38d9a9' }}>✓ EMAIL VERIFIED</p>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#c8cfe8' }}>Your email is confirmed. You're all set.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#f45e3f' }}>VERIFICATION FAILED</p>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#8892b8' }}>{message}</p>
          </>
        )}
        <Link to="/battle" className="px-5 py-2 font-bold text-xs uppercase tracking-widest hover:brightness-110"
              style={{ background: '#c42b2b', color: '#fff', boxShadow: '3px 3px 0 #7a1a0a', fontFamily: 'monospace' }}>
          Continue to Ring Tactics
        </Link>
      </div>
    </div>
  )
}
