import { useEffect } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/ui/Navbar'
import { Footer } from './components/ui/Footer'
import { RequireAuth } from './components/ui/RequireAuth'
import { BattlePage } from './pages/Battle'
import { CharacterPage } from './pages/Character'
import { CharactersPage } from './pages/Characters'
import { HomePage } from './pages/HomePage'
import { RankingPage } from './pages/Ranking'
import { PvpLobbyPage } from './pages/PvpLobby'
import { LadderPage } from './pages/LadderPage'
import { LoginPage } from './pages/LoginPage'
import { MissionsPage } from './pages/Missions'
import { LeaderboardsPage } from './pages/Leaderboards'
import { LegalPage } from './pages/LegalPage'
import { DiamondStorePage } from './pages/DiamondStore'
import { ProfilePage } from './pages/ProfilePage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { PreRegisterPage } from './pages/PreRegisterPage'
import { TutorialPage } from './pages/TutorialPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { useAuthStore } from './store/authStore'
import { useRankStore } from './store/rankStore'
import { useLaunchStore } from './store/launchStore'
import './pages/ArenaTheme.css'

export default function App() {
  const initializeAuth = useAuthStore(state => state.initialize)
  const isLoggedIn = useAuthStore(state => state.isLoggedIn)
  const email = useAuthStore(state => state.email)
  const emailVerified = useAuthStore(state => state.emailVerified)
  const fetchEconomy = useRankStore(state => state.fetchEconomy)
  const live = useLaunchStore(state => state.live)
  const fetchConfig = useLaunchStore(state => state.fetchConfig)

  useEffect(() => { void fetchConfig() }, [fetchConfig])
  useEffect(() => { void initializeAuth() }, [initializeAuth])
  useEffect(() => { if (isLoggedIn) void fetchEconomy() }, [isLoggedIn, fetchEconomy])

  // Still checking the launch flag — avoid flashing the wrong UI.
  if (live === null) return <div className="min-h-screen bg-px-base" />

  // Pre-launch mode: only Pre-Register and Tutorial are reachable; everything else shows Coming Soon.
  if (!live) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/pre-register" element={<PreRegisterPage />} />
          <Route path="/tutorial" element={<TutorialPage />} />
          <Route path="*" element={<ComingSoonPage />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-px-base flex flex-col">
        <Navbar />
        {isLoggedIn && email && !emailVerified && (
          <div style={{ background: '#4a3a10', borderBottom: '1px solid #ffd16644', padding: '6px 16px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#ffd166' }}>
              Please verify your email to secure your account. <Link to="/profile" style={{ textDecoration: 'underline' }}>Resend / manage in Profile</Link>
            </p>
          </div>
        )}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/characters/:id" element={<CharacterPage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/leaderboards" element={<LeaderboardsPage />} />
            <Route path="/ranking" element={<RequireAuth><RankingPage /></RequireAuth>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/battle" element={<RequireAuth requireVerified><BattlePage /></RequireAuth>} />
            <Route path="/pvp"    element={<RequireAuth requireVerified><PvpLobbyPage /></RequireAuth>} />
            <Route path="/ladder" element={<RequireAuth requireVerified><LadderPage /></RequireAuth>} />
            <Route path="/store" element={<DiamondStorePage />} />
            <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="/pre-register" element={<PreRegisterPage />} />
            <Route path="/tutorial" element={<TutorialPage />} />
            <Route path="/legal/:slug" element={<LegalPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
