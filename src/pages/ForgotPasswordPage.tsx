import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../store/authStore'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setError(data.error ?? 'Could not send reset email.'); return }
      setSent(true)
    } catch {
      setError('Cannot reach server. Try again soon.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="arena-page arena-stage min-h-screen bg-px-base text-px-text flex items-center justify-center px-4">
      <div className="arena-panel arena-panel-yellow flex flex-col gap-5 px-7 py-7"
           style={{ width: 420, background: '#141726', border: '2px solid #2e3755', boxShadow: '0 8px 40px rgba(0,0,0,.8)' }}>
        <div className="text-center">
          <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#ffd166', textTransform: 'uppercase', letterSpacing: 2 }}>Locker Room Reset</p>
          <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#fff', marginTop: 10 }}>FORGOT PASSWORD</h1>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4 text-center">
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#c8cfe8', lineHeight: 1.6 }}>
              If that email is on the roster, we sent a one-time reset link. Check your inbox and get back in the match.
            </p>
            <Link to="/login" className="arena-action text-center"
                  style={{ padding: '12px', background: '#c42b2b', color: '#fff', fontFamily: "'Press Start 2P', monospace", fontSize: 8, boxShadow: '3px 3px 0 #7a1a0a' }}>
              BACK TO LOGIN
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#8892b8', lineHeight: 1.6, margin: 0 }}>
              Enter your account email. We'll send a one-time link to reset your password before the count hits ten.
            </p>
            <div>
              <label style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a5578', display: 'block', marginBottom: 6 }}>EMAIL</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" maxLength={254} required
                     placeholder="you@example.com"
                     style={{ background: '#0c0e1a', border: '2px solid #2e3755', color: '#c8cfe8', padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, outline: 'none', width: '100%' }} />
            </div>
            {error && <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#f45e3f', margin: 0 }}>{error}</p>}
            <button className="arena-action" type="submit" disabled={loading}
                    style={{ padding: '12px', background: loading ? '#2e3755' : '#c42b2b', color: '#fff', fontFamily: "'Press Start 2P', monospace", fontSize: 8, boxShadow: loading ? 'none' : '3px 3px 0 #7a1a0a', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'SENDING...' : 'SEND RESET LINK'}
            </button>
            <Link to="/login" style={{ color: '#8892b8', fontFamily: 'monospace', fontSize: 11, textAlign: 'center', textDecoration: 'underline' }}>
              Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}