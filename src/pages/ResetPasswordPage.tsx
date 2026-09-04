import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { API } from '../store/authStore'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!token) { setError('Missing reset token.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setError(data.error ?? 'Could not reset password.'); return }
      setSuccess(true)
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
          <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#ffd166', textTransform: 'uppercase', letterSpacing: 2 }}>New Game Plan</p>
          <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#fff', marginTop: 10 }}>RESET PASSWORD</h1>
        </div>

        {success ? (
          <div className="flex flex-col gap-4 text-center">
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#c8cfe8', lineHeight: 1.6 }}>
              Password reset complete. Your old sessions have been signed out.
            </p>
            <button className="arena-action" onClick={() => navigate('/login')}
                    style={{ padding: '12px', background: '#c42b2b', color: '#fff', fontFamily: "'Press Start 2P', monospace", fontSize: 8, boxShadow: '3px 3px 0 #7a1a0a', border: 'none', cursor: 'pointer' }}>
              LOGIN
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#8892b8', lineHeight: 1.6, margin: 0 }}>
              Set a new password for your corner. Use at least 12 characters.
            </p>
            <div>
              <label style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a5578', display: 'block', marginBottom: 6 }}>NEW PASSWORD</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" minLength={12} maxLength={128} required
                     placeholder="••••••••••••"
                     style={{ background: '#0c0e1a', border: '2px solid #2e3755', color: '#c8cfe8', padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, outline: 'none', width: '100%' }} />
            </div>
            <div>
              <label style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a5578', display: 'block', marginBottom: 6 }}>CONFIRM PASSWORD</label>
              <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" minLength={12} maxLength={128} required
                     placeholder="••••••••••••"
                     style={{ background: '#0c0e1a', border: `2px solid ${confirm && confirm !== password ? '#f45e3f' : '#2e3755'}`, color: '#c8cfe8', padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, outline: 'none', width: '100%' }} />
            </div>
            {error && <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#f45e3f', margin: 0 }}>{error}</p>}
            <button className="arena-action" type="submit" disabled={loading || !token}
                    style={{ padding: '12px', background: loading || !token ? '#2e3755' : '#c42b2b', color: '#fff', fontFamily: "'Press Start 2P', monospace", fontSize: 8, boxShadow: loading || !token ? 'none' : '3px 3px 0 #7a1a0a', border: 'none', cursor: loading || !token ? 'not-allowed' : 'pointer' }}>
              {loading ? 'RESETTING...' : 'RESET PASSWORD'}
            </button>
            <Link to="/forgot-password" style={{ color: '#8892b8', fontFamily: 'monospace', fontSize: 11, textAlign: 'center', textDecoration: 'underline' }}>
              Request a new reset link
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}