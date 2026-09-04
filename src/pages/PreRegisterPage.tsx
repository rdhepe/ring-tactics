import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../store/authStore'

export function PreRegisterPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch(`${API}/pre-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json() as { ok?: boolean; alreadyRegistered?: boolean; error?: string }
      if (!res.ok) { setStatus('error'); setMessage(data.error ?? 'Something went wrong.'); return }
      setStatus('success')
      setMessage(data.alreadyRegistered
        ? "You're already on the list — we'll email you when Ring Tactics launches!"
        : "You're on the list! We'll email you the moment Ring Tactics launches.")
    } catch {
      setStatus('error')
      setMessage('Cannot reach server. Please try again later.')
    }
  }

  return (
    <div className="arena-page arena-stage min-h-screen bg-px-base text-px-text flex flex-col">
      <div className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-6xl mx-auto px-4 py-5 text-center">
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 18 }}>
            <span style={{ color: '#ffd166' }}>RING</span>
            <span style={{ color: '#e2e8ff' }}> TACTICS</span>
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="arena-panel arena-panel-yellow" style={{ width: 420, background: '#141726', border: '2px solid #2e3755',
                      boxShadow: '0 8px 40px rgba(0,0,0,.8)' }}>
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: '#ffd166' }}>
              PRE-REGISTER NOW
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#8892b8', lineHeight: 1.6 }}>
              Ring Tactics is gearing up for launch. Drop your email below and we'll notify you the second the ring opens.
            </p>

            {status === 'success' ? (
              <div className="flex flex-col items-center gap-3 mt-2">
                <span style={{ fontSize: 32 }}>✓</span>
                <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#38d9a9' }}>{message}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-3 w-full mt-2">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                       placeholder="you@example.com" required maxLength={254}
                       style={{
                         background: '#0c0e1a', border: '2px solid #2e3755', color: '#c8cfe8',
                         padding: '12px 14px', fontFamily: 'monospace', fontSize: 13, outline: 'none', width: '100%',
                       }} />
                {status === 'error' && (
                  <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#f45e3f', margin: 0 }}>{message}</p>
                )}
                <button type="submit" disabled={status === 'loading'}
                        className="arena-action"
                        style={{
                          padding: '12px',
                          background: status === 'loading' ? '#2e3755' : '#c42b2b',
                          color: '#fff',
                          fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                          boxShadow: status === 'loading' ? 'none' : '3px 3px 0 #7a1a0a',
                          border: 'none',
                          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                        }}>
                  {status === 'loading' ? 'SUBMITTING...' : '▶ PRE-REGISTER'}
                </button>
              </form>
            )}

            <Link to="/tutorial" className="text-px-gold hover:brightness-110"
                  style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 8, textDecoration: 'underline' }}>
              See how the game is played →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
