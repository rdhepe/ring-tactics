import { useEffect, useState } from 'react'
import { API, useAuthStore } from '../store/authStore'

interface ProfileData {
  username: string
  email: string | null
  createdAt: string
}

interface HistoryEntry {
  orderId: string
  packageName: string
  diamonds: number
  amountPaise: number
  status: 'created' | 'paid'
  createdAt: string
  paidAt: string | null
}

export function ProfilePage() {
  const username = useAuthStore(s => s.username)
  const setEmail = useAuthStore(s => s.setEmail)

  const [profile, setProfile]   = useState<ProfileData | null>(null)
  const [history, setHistory]   = useState<HistoryEntry[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg]       = useState<{ text: string; ok: boolean } | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving]               = useState(false)
  const [pwMsg, setPwMsg]                     = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    void fetch(`${API}/profile`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((data: ProfileData | null) => {
        if (!data) return
        setProfile(data)
        setEmailInput(data.email ?? '')
      })
    void fetch(`${API}/payments/history`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((data: HistoryEntry[]) => setHistory(data))
  }, [])

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault()
    setEmailSaving(true)
    setEmailMsg(null)
    try {
      const res = await fetch(`${API}/profile`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() || null }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setEmailMsg({ text: data.error ?? 'Could not update email.', ok: false }); return }
      setEmail(emailInput.trim() || null)
      setEmailMsg({ text: 'Email updated.', ok: true })
    } catch {
      setEmailMsg({ text: 'Cannot reach server.', ok: false })
    } finally {
      setEmailSaving(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (newPassword !== confirmPassword) { setPwMsg({ text: 'New passwords do not match.', ok: false }); return }
    setPwSaving(true)
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setPwMsg({ text: data.error ?? 'Could not change password.', ok: false }); return }
      setPwMsg({ text: 'Password changed.', ok: true })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch {
      setPwMsg({ text: 'Cannot reach server.', ok: false })
    } finally {
      setPwSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#0c0e1a', border: '2px solid #2e3755', color: '#c8cfe8',
    padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, outline: 'none', width: '100%',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: 10, color: '#4a5578', display: 'block', marginBottom: 6,
  }

  return (
    <div className="arena-page min-h-screen bg-px-base text-px-text">
      <div className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-4xl mx-auto px-4 py-5">
          <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-1"
             style={{ fontFamily: 'monospace' }}>Ring Tactics</p>
          <h1 className="text-2xl font-bold uppercase tracking-widest">My Profile</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* account info */}
        <div className="arena-panel px-6 py-6" style={{ background: '#141726', border: '2px solid #2e3755' }}>
          <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-4" style={{ fontFamily: 'monospace' }}>Account</p>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p style={labelStyle}>USERNAME</p>
              <p className="text-px-text font-bold">{username}</p>
            </div>
            {profile && (
              <div>
                <p style={labelStyle}>MEMBER SINCE</p>
                <p className="text-px-muted">{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          <form onSubmit={saveEmail} className="flex flex-col gap-2 max-w-sm">
            <label style={labelStyle}>EMAIL</label>
            <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
                   placeholder="you@example.com" style={inputStyle} />
            {emailMsg && (
              <p style={{ fontFamily: 'monospace', fontSize: 10, color: emailMsg.ok ? '#38d9a9' : '#f45e3f' }}>{emailMsg.text}</p>
            )}
            <button type="submit" disabled={emailSaving}
                    className="self-start px-4 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                    style={{ background: '#1d2235', color: '#e2e8ff', border: '1px solid #445180' }}>
              {emailSaving ? 'Saving…' : 'Save Email'}
            </button>
          </form>
        </div>

        {/* change password */}
        <div className="arena-panel px-6 py-6" style={{ background: '#141726', border: '2px solid #2e3755' }}>
          <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-4" style={{ fontFamily: 'monospace' }}>Change Password</p>
          <form onSubmit={changePassword} className="flex flex-col gap-3 max-w-sm">
            <div>
              <label style={labelStyle}>CURRENT PASSWORD</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                     required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>NEW PASSWORD</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                     minLength={12} maxLength={128} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>CONFIRM NEW PASSWORD</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                     required style={inputStyle} />
            </div>
            {pwMsg && (
              <p style={{ fontFamily: 'monospace', fontSize: 10, color: pwMsg.ok ? '#38d9a9' : '#f45e3f' }}>{pwMsg.text}</p>
            )}
            <button type="submit" disabled={pwSaving}
                    className="self-start px-4 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                    style={{ background: '#c42b2b', color: '#fff', boxShadow: '3px 3px 0 #7a1a0a' }}>
              {pwSaving ? 'Saving…' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* transaction history */}
        <div className="arena-panel" style={{ background: '#141726', border: '2px solid #2e3755' }}>
          <div className="px-6 py-4" style={{ borderBottom: '2px solid #2e3755' }}>
            <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily: 'monospace' }}>Transaction History</p>
          </div>
          {history.length === 0 ? (
            <p className="text-px-muted text-sm px-6 py-6">No diamond purchases yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid #2e3755' }}>
                    <th className="text-left py-2 px-4 text-px-dim uppercase tracking-widest text-xs" style={{ fontFamily: 'monospace' }}>Date</th>
                    <th className="text-left py-2 px-4 text-px-dim uppercase tracking-widest text-xs" style={{ fontFamily: 'monospace' }}>Package</th>
                    <th className="text-left py-2 px-4 text-px-dim uppercase tracking-widest text-xs" style={{ fontFamily: 'monospace' }}>Diamonds</th>
                    <th className="text-left py-2 px-4 text-px-dim uppercase tracking-widest text-xs" style={{ fontFamily: 'monospace' }}>Amount</th>
                    <th className="text-left py-2 px-4 text-px-dim uppercase tracking-widest text-xs" style={{ fontFamily: 'monospace' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(entry => (
                    <tr key={entry.orderId} style={{ borderBottom: '1px solid #2e3755' }}>
                      <td className="py-2 px-4 text-px-muted">{new Date(entry.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 px-4 text-px-text font-bold">{entry.packageName}</td>
                      <td className="py-2 px-4 text-px-muted">💎 {entry.diamonds.toLocaleString()}</td>
                      <td className="py-2 px-4 text-px-gold font-bold">₹{(entry.amountPaise / 100).toFixed(2)}</td>
                      <td className="py-2 px-4">
                        <span style={{
                          fontFamily: 'monospace', fontSize: 10, padding: '2px 8px',
                          color: entry.status === 'paid' ? '#38d9a9' : '#8892b8',
                          background: entry.status === 'paid' ? '#38d9a922' : '#8892b822',
                        }}>
                          {entry.status === 'paid' ? 'PAID' : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
