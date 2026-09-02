import { useRankStore, getRankInfo, RANKS } from '../store/rankStore'

function XpBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-3 relative" style={{ background: '#1d2235', border: '1px solid #2e3755' }}>
      <div className="absolute top-0 left-0 h-full transition-all duration-500"
           style={{ width: `${pct}%`, background: color }} />
      {[25, 50, 75].map(p => (
        <div key={p} className="absolute top-0 h-full w-px" style={{ left: `${p}%`, background: 'rgba(0,0,0,.35)' }} />
      ))}
    </div>
  )
}

export function RankingPage() {
  const { xp, wins, losses, history, reset } = useRankStore()
  const { rank, index, next, xpInRank, xpNeeded, pct } = getRankInfo(xp)
  const total = wins + losses

  return (
    <div className="arena-page min-h-screen bg-px-base text-px-text">
      {/* page header */}
      <div className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-4xl mx-auto px-4 py-5">
          <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-1"
             style={{ fontFamily: 'monospace' }}>Ring Tactics</p>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Ranking</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* ── current rank card ── */}
        <div className="arena-panel" style={{ background: '#141726', border: `2px solid ${rank.color}44`, borderTop: `4px solid ${rank.color}` }}>
          <div className="px-6 py-5 flex items-center gap-5">
            {/* badge */}
            <div className="shrink-0 flex items-center justify-center font-bold"
                 style={{ width: 72, height: 72, background: rank.color + '22',
                          border: `3px solid ${rank.color}`,
                          fontFamily: "'Press Start 2P', monospace", fontSize: 28, color: rank.color }}>
              {rank.badge}
            </div>
            {/* info */}
            <div className="flex-1">
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14, color: rank.color,
                          marginBottom: 4 }}>
                {rank.name.toUpperCase()}
              </p>
              <p className="text-px-muted text-sm mb-3">{xp.toLocaleString()} total XP</p>
              <XpBar pct={pct} color={rank.color} />
              <div className="flex justify-between mt-1">
                <span className="text-px-dim" style={{ fontSize: 9, fontFamily: 'monospace' }}>
                  {next ? `${xpInRank} / ${xpNeeded} XP to ${next.name}` : 'MAX RANK'}
                </span>
                <span className="text-px-dim" style={{ fontSize: 9, fontFamily: 'monospace' }}>
                  {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* stats row */}
          <div className="grid grid-cols-3 border-t-2" style={{ borderColor: '#2e3755' }}>
            {[
              { label: 'Wins',   value: wins,          color: '#38d9a9' },
              { label: 'Losses', value: losses,         color: '#f45e3f' },
              { label: 'Total',  value: total,          color: '#8892b8' },
            ].map(({ label, value, color }) => (
              <div key={label} className="px-4 py-3 text-center" style={{ borderRight: '1px solid #2e3755' }}>
                <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 18, color }}>{value}</p>
                <p className="text-px-dim text-xs uppercase tracking-widest mt-1"
                   style={{ fontFamily: 'monospace' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── rank ladder ── */}
        <div className="arena-panel" style={{ background: '#141726', border: '2px solid #2e3755' }}>
          <div className="px-4 py-3" style={{ borderBottom: '2px solid #2e3755', background: '#0f1120' }}>
            <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest"
               style={{ fontFamily: 'monospace' }}>Rank Ladder</p>
          </div>
          <div className="flex flex-col">
            {RANKS.map((r, i) => {
              const isCurrent = i === index
              const isUnlocked = xp >= r.minXp
              return (
                <div key={r.name}
                     className="flex items-center gap-3 px-4 py-2.5"
                     style={{
                       borderBottom: '1px solid #1d2235',
                       background: isCurrent ? r.color + '12' : 'transparent',
                       opacity: isUnlocked ? 1 : 0.4,
                     }}>
                  <div className="shrink-0 flex items-center justify-center font-bold"
                       style={{ width: 32, height: 32, background: r.color + '22',
                                border: `2px solid ${isCurrent ? r.color : r.color + '55'}`,
                                fontFamily: "'Press Start 2P', monospace", fontSize: 12, color: r.color }}>
                    {r.badge}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: isCurrent ? r.color : '#c8cfe8' }}>
                      {r.name}
                      {isCurrent && <span className="ml-2 text-[9px]" style={{ fontFamily: 'monospace', color: r.color }}>◀ YOU</span>}
                    </p>
                    <p className="text-px-dim text-xs" style={{ fontFamily: 'monospace' }}>
                      {r.minXp.toLocaleString()} XP
                    </p>
                  </div>
                  {isUnlocked && !isCurrent && (
                    <span style={{ fontSize: 10, color: '#38d9a9' }}>✓</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── match history ── */}
        {history.length > 0 && (
          <div className="arena-panel" style={{ background: '#141726', border: '2px solid #2e3755' }}>
            <div className="px-4 py-3 flex items-center justify-between"
                 style={{ borderBottom: '2px solid #2e3755', background: '#0f1120' }}>
              <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest"
                 style={{ fontFamily: 'monospace' }}>Recent Matches</p>
              <button onClick={reset}
                      className="text-[9px] font-bold uppercase tracking-widest hover:brightness-110"
                      style={{ color: '#4a5578', fontFamily: 'monospace', background: 'none', border: 'none',
                               cursor: 'pointer' }}>
                Reset Stats
              </button>
            </div>
            <div className="flex flex-col">
              {history.slice(0, 10).map((m, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2"
                     style={{ borderBottom: '1px solid #1d2235' }}>
                  <span className="font-bold text-xs px-2 py-0.5"
                        style={{ background: m.result === 'win' ? '#38d9a9' : '#f45e3f',
                                 color: '#0c0e1a', fontFamily: 'monospace', minWidth: 36, textAlign: 'center' }}>
                    {m.result === 'win' ? 'WIN' : 'LOSS'}
                  </span>
                  <span className="text-px-muted text-xs flex-1" style={{ fontFamily: 'monospace' }}>
                    {m.turns} turns
                  </span>
                  <span className="font-bold text-xs"
                        style={{ color: '#ffd166', fontFamily: "'Press Start 2P', monospace", fontSize: 9 }}>
                    +{m.xpGained} XP
                  </span>
                  <span className="text-px-dim text-[9px]" style={{ fontFamily: 'monospace' }}>
                    {new Date(m.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
