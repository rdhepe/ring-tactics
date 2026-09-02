import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'

const VALID = /^[a-zA-Z0-9_\-]{3,20}$/

interface Props { onClose?: () => void }

export function UsernameModal({ onClose }: Props) {
  const { username, setUsername } = useAuthStore()
  const [input, setInput] = useState(username ?? '')
  const [error, setError] = useState('')

  function submit() {
    const v = input.trim()
    if (!VALID.test(v)) { setError('3–20 chars: letters, numbers, _ or -'); return }
    setUsername(v)
    onClose?.()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[70]"
         style={{ background: 'rgba(0,0,0,.85)' }}>
      <div style={{ width: 360, background: '#0c0e1a', border: '2px solid #ffd16666',
                    boxShadow: '0 8px 40px rgba(0,0,0,.95)' }}>
        <div className="px-6 py-4" style={{ borderBottom: '2px solid #2e3755', background: '#0f1120' }}>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#ffd166' }}>
            {username ? 'CHANGE USERNAME' : 'SET YOUR USERNAME'}
          </p>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#8892b8' }}>
            Your name will be visible to opponents during matchmaking and battle.
          </p>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="YourName"
            maxLength={20}
            autoFocus
            style={{
              background: '#141726', border: `2px solid ${error ? '#f45e3f' : '#2e3755'}`,
              color: '#ffd166', padding: '10px 14px',
              fontFamily: "'Press Start 2P', monospace", fontSize: 13,
              letterSpacing: 2, outline: 'none', width: '100%',
            }}
          />
          {error && <p style={{ fontFamily: 'monospace', fontSize: 10, color: '#f45e3f' }}>{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4"
             style={{ borderTop: '2px solid #2e3755', background: '#0f1120' }}>
          {onClose && username && (
            <button onClick={onClose}
                    style={{ padding: '6px 18px', background: '#1d2235', color: '#8892b8',
                             border: '1px solid #2e3755', fontFamily: 'monospace', fontSize: 9, cursor: 'pointer' }}>
              CANCEL
            </button>
          )}
          <button onClick={submit}
                  disabled={input.trim().length < 3}
                  style={{
                    padding: '6px 24px',
                    background: input.trim().length >= 3 ? '#ffd166' : '#2e3755',
                    color: input.trim().length >= 3 ? '#0c0e1a' : '#4a5578',
                    fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                    boxShadow: input.trim().length >= 3 ? '3px 3px 0 #7a5b1e' : 'none',
                    border: 'none', cursor: input.trim().length >= 3 ? 'pointer' : 'not-allowed',
                  }}>
            ▶ CONFIRM
          </button>
        </div>
      </div>
    </div>
  )
}
