import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
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
import { useAuthStore } from './store/authStore'
import './pages/ArenaTheme.css'

export default function App() {
  const initializeAuth = useAuthStore(state => state.initialize)

  useEffect(() => { void initializeAuth() }, [initializeAuth])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-px-base flex flex-col">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/characters/:id" element={<CharacterPage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/leaderboards" element={<LeaderboardsPage />} />
            <Route path="/ranking" element={<RequireAuth><RankingPage /></RequireAuth>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/battle" element={<RequireAuth><BattlePage /></RequireAuth>} />
            <Route path="/pvp"    element={<RequireAuth><PvpLobbyPage /></RequireAuth>} />
            <Route path="/ladder" element={<RequireAuth><LadderPage /></RequireAuth>} />
            <Route path="/legal/:slug" element={<LegalPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
