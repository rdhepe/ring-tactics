import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useRankStore } from '../store/rankStore'

export function DiamondStorePage() {
  const { isLoggedIn } = useAuthStore()
  const { diamonds } = useRankStore()

  return (
    <div className="arena-page min-h-screen bg-px-base text-px-text">
      <div className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-4xl mx-auto px-4 py-5">
          <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-1"
             style={{ fontFamily: 'monospace' }}>Ring Tactics</p>
          <h1 className="text-2xl font-bold uppercase tracking-widest">💎 Diamond Store</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoggedIn && (
          <p className="text-px-muted text-sm mb-6">
            Current balance: <span className="text-[#6be8ff] font-bold">{diamonds} 💎</span>
          </p>
        )}
        <div className="arena-panel arena-panel-yellow px-6 py-8 text-center"
             style={{ background: '#141726', border: '2px solid #2e3755' }}>
          <p className="text-px-gold text-[9px] font-bold uppercase tracking-widest mb-3" style={{ fontFamily: 'monospace' }}>
            Payments paused
          </p>
          <h2 className="text-xl font-bold uppercase tracking-widest mb-4">💎 Diamond Store coming soon</h2>
          <p className="text-px-muted text-sm max-w-xl mx-auto leading-relaxed">
            Diamond purchases are temporarily unavailable while we choose a reliable payment gateway. No checkout is available right now.
          </p>
        </div>

        <Link to="/legal/pricing" className="inline-block mt-8 text-px-gold text-xs uppercase tracking-widest hover:brightness-110"
              style={{ fontFamily: 'monospace' }}>
          &larr; Back to Pricing Details
        </Link>
      </div>
    </div>
  )
}
