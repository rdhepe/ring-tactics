import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, API } from '../store/authStore'

type Mode = 'login' | 'register'

export function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login } = useAuthStore()

  const [mode, setMode]         = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [registered, setRegistered] = useState(false)

  const returnTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/battle'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (mode === 'register' && password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/${mode}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'register'
          ? { username: username.trim(), password, email: email.trim() }
          : { username: username.trim(), password }),
      })
      const data = await res.json() as { username?: string; email?: string | null; emailVerified?: boolean; error?: string }
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      login(data.username!, data.email ?? null, data.emailVerified ?? false)
      if (mode === 'register') { setRegistered(true); return }
      navigate(returnTo, { replace: true })
    } catch {
      setError('Cannot reach server. Make sure it is running.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (hasErr: boolean): React.CSSProperties => ({
    background: '#0c0e1a',
    border: `2px solid ${hasErr ? '#f45e3f' : '#2e3755'}`,
    color: '#c8cfe8', padding: '10px 14px',
    fontFamily: 'monospace', fontSize: 13,
    outline: 'none', width: '100%',
  })

  return (
    <div className="arena-page arena-stage min-h-screen bg-px-base text-px-text flex flex-col">
      {/* Header */}
      <div className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-6xl mx-auto px-4 py-5 text-center">
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 18 }}>
            <span style={{ color: '#ffd166' }}>RING</span>
            <span style={{ color: '#e2e8ff' }}> TACTICS</span>
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="arena-panel arena-panel-yellow" style={{ width: 380, background: '#141726', border: '2px solid #2e3755',
                      boxShadow: '0 8px 40px rgba(0,0,0,.8)' }}>
          {registered ? (
            <div className="flex flex-col items-center gap-4 p-6 text-center">
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#38d9a9' }}>✓ ACCOUNT CREATED</p>
              <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#c8cfe8' }}>
                We sent a verification link to <span style={{ color: '#ffd166' }}>{email}</span>. Check your inbox to verify your email.
              </p>
              <button className="arena-action" onClick={() => navigate(returnTo, { replace: true })}
                      style={{ padding: '10px 24px', background: '#c42b2b', color: '#fff',
                               fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                               boxShadow: '3px 3px 0 #7a1a0a', border: 'none', cursor: 'pointer' }}>
                ▶ CONTINUE
              </button>
            </div>
          ) : (
          <>
          {/* Tab switcher */}
          <div className="flex" style={{ borderBottom: '2px solid #2e3755' }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                      style={{
                        flex: 1, padding: '12px',
                        background: mode === m ? '#0c0e1a' : 'transparent',
                        color: mode === m ? '#ffd166' : '#4a5578',
                        borderBottom: mode === m ? '2px solid #ffd166' : 'none',
                        fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                        textTransform: 'uppercase', cursor: 'pointer', border: 'none',
                      }}>
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4 p-6">
            <div>
              <label style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a5578',
                              display: 'block', marginBottom: 6 }}>USERNAME</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                     placeholder="YourName" maxLength={20} required
                     style={inputStyle(false)} />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a5578',
                                display: 'block', marginBottom: 6 }}>EMAIL</label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                       type="email" placeholder="you@example.com" maxLength={254} required
                       style={inputStyle(false)} />
              </div>
            )}

            <div>
              <label style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a5578',
                              display: 'block', marginBottom: 6 }}>PASSWORD</label>
              <input value={password} onChange={e => setPassword(e.target.value)}
                     type="password" placeholder="••••••••••••" minLength={12} maxLength={128} required
                     style={inputStyle(false)} />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a5578',
                                display: 'block', marginBottom: 6 }}>CONFIRM PASSWORD</label>
                <input value={confirm} onChange={e => setConfirm(e.target.value)}
                       type="password" placeholder="••••••" required
                       style={inputStyle(confirm.length > 0 && confirm !== password)} />
              </div>
            )}

            {error && (
              <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#f45e3f', margin: 0 }}>
                {error}
              </p>
            )}

            {mode === 'register' && (
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: '#4a5578', margin: 0 }}>
                Use at least 12 characters. We'll send a verification link to your email.
              </p>
            )}

            {mode === 'login' && (
              <Link to="/forgot-password" style={{ alignSelf: 'flex-end', color: '#8892b8', fontFamily: 'monospace', fontSize: 10, textDecoration: 'underline' }}>
                Forgot password?
              </Link>
            )}

            <button className="arena-action" type="submit" disabled={loading}
                    style={{
                      padding: '12px',
                      background: loading ? '#2e3755' : '#c42b2b',
                      color: '#fff',
                      fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                      boxShadow: loading ? 'none' : '3px 3px 0 #7a1a0a',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      marginTop: 4,
                    }}>
              {loading ? 'Please wait...' : mode === 'login' ? '▶ LOGIN' : '▶ CREATE ACCOUNT'}
            </button>
          </form>
          </>
          )}
        </div>
      </div>
    </div>
  )
}
