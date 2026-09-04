import { Link } from 'react-router-dom'

export function ComingSoonPage() {
  return (
    <div className="arena-page arena-stage min-h-screen bg-px-base text-px-text flex flex-col items-center justify-center px-4 text-center gap-6">
      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22 }}>
        <span style={{ color: '#ffd166' }}>RING</span>
        <span style={{ color: '#e2e8ff' }}> TACTICS</span>
      </p>
      <div className="arena-panel arena-panel-yellow flex flex-col items-center gap-4 px-8 py-8"
           style={{ width: 420, background: '#141726', border: '2px solid #2e3755' }}>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: '#ffd166' }}>COMING SOON</p>
        <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#8892b8', lineHeight: 1.6 }}>
          We're putting the finishing touches on Ring Tactics. Pre-register now so you're the first to know when the ring opens.
        </p>
        <div className="flex flex-col gap-3 w-full mt-2">
          <Link to="/pre-register" className="arena-action"
                style={{ padding: '12px', background: '#c42b2b', color: '#fff',
                         fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                         boxShadow: '3px 3px 0 #7a1a0a', textAlign: 'center' }}>
            ▶ PRE-REGISTER
          </Link>
          <Link to="/tutorial"
                style={{ padding: '12px', background: '#1d2235', color: '#e2e8ff', border: '1px solid #445180',
                         fontFamily: "'Press Start 2P', monospace", fontSize: 8, textAlign: 'center' }}>
            HOW TO PLAY
          </Link>
        </div>
      </div>
    </div>
  )
}
