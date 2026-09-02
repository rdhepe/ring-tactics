import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getMissionProgress, MISSIONS, useMissionStore } from '../store/missionStore'

export function MissionsPage() {
  const { isLoggedIn, username } = useAuthStore()
  const progressByUser = useMissionStore(state => state.progressByUser)
  const progress = username ? getMissionProgress(progressByUser, username) : null
  const completed = progress
    ? MISSIONS.filter(mission => progress[mission.id] >= mission.target).length
    : 0

  return (
    <main className="arena-page min-h-screen bg-px-base text-px-text">
      <header className="arena-page-header" style={{ background: '#141726', borderBottom: '4px solid #c42b2b' }}>
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-px-dim text-[9px] font-bold uppercase tracking-widest mb-1"
               style={{ fontFamily: 'monospace' }}>Ring Tactics</p>
            <h1 className="text-2xl font-bold uppercase tracking-widest">Missions</h1>
          </div>
          {progress && (
            <div className="text-right">
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: '#ffd166' }}>
                {completed}/{MISSIONS.length}
              </p>
              <p className="text-px-dim uppercase mt-1" style={{ fontFamily: 'monospace', fontSize: 9 }}>
                Completed
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {!isLoggedIn && (
          <section className="arena-ticket mb-6 px-5 py-4 flex flex-wrap items-center justify-between gap-4"
                   style={{ background: '#0f1120', border: '2px solid #2e3755', borderLeft: '4px solid #ffd166' }}>
            <div>
              <p className="font-bold uppercase tracking-widest text-sm">Track your mission progress</p>
              <p className="text-px-muted text-xs mt-1" style={{ fontFamily: 'monospace' }}>
                Log in to see your progress. Every completed match counts.
              </p>
            </div>
            <Link to="/login"
                  className="px-5 py-2 font-bold text-xs uppercase tracking-widest hover:brightness-110"
                  style={{ background: '#c42b2b', color: '#fff', boxShadow: '3px 3px 0 #7a1a0a' }}>
              Log In
            </Link>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MISSIONS.map(mission => {
            const current = progress ? Math.min(progress[mission.id], mission.target) : 0
            const isComplete = progress ? current >= mission.target : false
            const pct = progress ? (current / mission.target) * 100 : 0
            const isRivalry = mission.category === 'rivalry'

            return (
              <article key={`${mission.id}-${mission.target}`}
                       className="arena-panel flex gap-4 p-5"
                       style={{
                         background: '#141726',
                         border: `2px solid ${isComplete ? '#38d9a966' : '#2e3755'}`,
                         borderTop: `4px solid ${isComplete ? '#38d9a9' : isRivalry ? '#f4a83f' : '#c42b2b'}`,
                       }}>
                <div className="shrink-0 flex items-center justify-center font-bold"
                     style={{
                       width: 44,
                       height: 44,
                       background: isComplete ? '#38d9a922' : '#1d2235',
                       border: `2px solid ${isComplete ? '#38d9a9' : '#4a5578'}`,
                       color: isComplete ? '#38d9a9' : '#8892b8',
                       fontFamily: "'Press Start 2P', monospace",
                       fontSize: 10,
                     }}>
                  {isComplete ? 'OK' : mission.badge}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="uppercase tracking-widest mb-1"
                         style={{ color: isRivalry ? '#f4a83f' : '#4a5578', fontFamily: 'monospace', fontSize: 8 }}>
                        {isRivalry ? 'Rivalry Mission' : 'Career Mission'}
                      </p>
                      <h2 className="font-bold uppercase tracking-wider text-sm">{mission.name}</h2>
                    </div>
                    {isComplete && (
                      <span className="shrink-0 font-bold uppercase" style={{ color: '#38d9a9', fontSize: 9, fontFamily: 'monospace' }}>
                        Complete
                      </span>
                    )}
                  </div>
                  <p className="text-px-muted text-xs mt-1 mb-4" style={{ fontFamily: 'monospace' }}>
                    {mission.description}
                  </p>

                  {progress ? (
                    <>
                      <div className="h-2 relative" style={{ background: '#0c0e1a', border: '1px solid #2e3755' }}>
                        <div className="absolute inset-y-0 left-0 transition-all duration-500"
                             style={{ width: `${pct}%`, background: isComplete ? '#38d9a9' : '#ffd166' }} />
                      </div>
                      <p className="text-right mt-1" style={{ color: isComplete ? '#38d9a9' : '#8892b8', fontFamily: 'monospace', fontSize: 9 }}>
                        {current} / {mission.target}
                      </p>
                    </>
                  ) : (
                    <p className="uppercase tracking-widest" style={{ color: '#4a5578', fontFamily: 'monospace', fontSize: 9 }}>
                      Log in to reveal progress
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </main>
  )
}
