import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useRankStore } from '../../store/rankStore'

export function Navbar() {
  const { username, isLoggedIn, logout } = useAuthStore()
  const { coins, diamonds } = useRankStore()
  const navigate = useNavigate()

  const navLinks = [
    { to: '/characters', label: 'Roster',    public: true  },
    { to: '/missions',   label: 'Missions',  public: true  },
    { to: '/leaderboards', label: 'Leaders', public: true  },
    { to: '/battle',     label: 'Match',     public: false },
    { to: '/ranking',    label: 'Rank',      public: false },
  ] as const

  return (
    <nav className="event-nav bg-px-panel border-b-2 border-px-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-8">
        <Link to="/" className="tracking-widest uppercase shrink-0"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>
          <span className="text-px-gold">RING</span><span className="text-px-text"> TACTICS</span>
        </Link>

        <div className="flex gap-0.5">
          {navLinks.filter(l => l.public || isLoggedIn).map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                isActive
                  ? 'px-4 py-1.5 bg-px-surface border-b-2 border-px-gold text-px-gold font-bold text-sm tracking-widest uppercase'
                  : 'px-4 py-1.5 text-px-muted hover:text-px-text font-bold text-sm tracking-widest uppercase transition-colors'
              }>
              {label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <span title="Coins" style={{ fontFamily: 'monospace', fontSize: 10, color: '#ffd166',
                             background: '#ffd16622', border: '1px solid #ffd16644', padding: '3px 10px' }}>
                🪙 {coins}
              </span>
              <Link to="/store" title="Buy diamonds"
                    style={{ fontFamily: 'monospace', fontSize: 10, color: '#6be8ff',
                             background: '#6be8ff22', border: '1px solid #6be8ff44', padding: '3px 10px' }}>
                💎 {diamonds}
              </Link>
              <Link to="/profile" title="My Profile"
                    style={{ fontFamily: 'monospace', fontSize: 10, color: '#38d9a9',
                             background: '#38d9a922', border: '1px solid #38d9a944', padding: '3px 10px' }}>
                {username}
              </Link>
              <button
                onClick={() => { logout(); navigate('/') }}
                style={{ fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
                         color: '#f45e3f', background: '#f45e3f11', border: '1px solid #f45e3f44',
                         padding: '3px 10px' }}>
                LOGOUT
              </button>
              <Link to="/battle"
                    className="px-5 py-1.5 bg-px-gold text-px-base font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all"
                    style={{ boxShadow: '3px 3px 0 #7a5b1e' }}>
                ▶ Fight!
              </Link>
            </>
          ) : (
            <Link to="/login"
                  className="px-5 py-1.5 font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all"
                  style={{ background: '#c42b2b', color: '#fff', boxShadow: '3px 3px 0 #7a1a0a' }}>
              ▶ Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
