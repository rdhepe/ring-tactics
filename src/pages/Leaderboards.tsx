import { LeaderboardGrid } from '../components/leaderboards/LeaderboardGrid'

export function LeaderboardsPage() {
  return (
    <main className="arena-page min-h-screen bg-px-base text-px-text">
      <header className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-1"
             style={{ fontFamily: 'monospace' }}>Ring Tactics Records</p>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Leaderboards</h1>
          <p className="text-px-muted text-sm mt-2">The top ten competitors across every arena record.</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <LeaderboardGrid limit={10} />
      </div>
    </main>
  )
}