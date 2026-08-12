import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './state/authStore'
import { useGameStore } from './state/gameStore'
import { NotificationToast } from './ui/components/NotificationToast'
import { LoadingScreen } from './ui/screens/LoadingScreen'
import { LoginScreen } from './ui/screens/LoginScreen'

const BattleScreen = lazy(() => import('./ui/screens/BattleScreen').then((module) => ({ default: module.BattleScreen })))
const BoundItemScreen = lazy(() => import('./ui/screens/BoundItemScreen').then((module) => ({ default: module.BoundItemScreen })))
const CharacterCreationScreen = lazy(() => import('./ui/screens/CharacterCreationScreen').then((module) => ({ default: module.CharacterCreationScreen })))
const NpcsScreen = lazy(() => import('./ui/screens/NpcsScreen').then((module) => ({ default: module.NpcsScreen })))
const NexusScreen = lazy(() => import('./ui/screens/NexusScreen').then((module) => ({ default: module.NexusScreen })))
const CharacterScreen = lazy(() => import('./ui/screens/CharacterScreen').then((module) => ({ default: module.CharacterScreen })))
const PrologueScreen = lazy(() => import('./ui/screens/PrologueScreen').then((module) => ({ default: module.PrologueScreen })))
const QuestsScreen = lazy(() => import('./ui/screens/QuestsScreen').then((module) => ({ default: module.QuestsScreen })))
const SettingsScreen = lazy(() => import('./ui/screens/SettingsScreen').then((module) => ({ default: module.SettingsScreen })))
const SkillTreeScreen = lazy(() => import('./ui/screens/SkillTreeScreen').then((module) => ({ default: module.SkillTreeScreen })))
const TerranScreen = lazy(() => import('./ui/screens/TerranScreen').then((module) => ({ default: module.TerranScreen })))
const TerranLocationScreen = lazy(() => import('./ui/screens/TerranLocationScreen').then((module) => ({ default: module.TerranLocationScreen })))
const WorldScreen = lazy(() => import('./ui/screens/WorldScreen').then((module) => ({ default: module.WorldScreen })))

function GameBoot({ children }: { children: ReactNode }) {
  const authStatus = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const gameStatus = useGameStore((state) => state.status)
  const ownerId = useGameStore((state) => state.ownerId)
  const error = useGameStore((state) => state.error)
  const boot = useGameStore((state) => state.boot)

  useEffect(() => {
    if (authStatus === 'signedIn' && user && ownerId !== user.uid) void boot(user.uid)
  }, [authStatus, boot, ownerId, user])

  if (authStatus === 'loading') return <LoadingScreen label="Reconhecendo sua assinatura…" />
  if (authStatus !== 'signedIn' || !user) return <Navigate to="/login" replace />
  if (gameStatus === 'idle' || gameStatus === 'loading' || ownerId !== user.uid) {
    return <LoadingScreen label="Carregando o Nexo…" />
  }
  if (gameStatus === 'error') {
    return <main className="fatal-screen"><h1>O save não pôde ser carregado</h1><p>{error}</p></main>
  }
  return children
}

function EntryRouter() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />
  if (!save.character.bondedEquipment.weapon) return <Navigate to="/new-game" replace />
  if (save.battle) return <Navigate to="/battle" replace />
  return <Navigate to="/terran" replace />
}

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initialize)

  useEffect(() => initializeAuth(), [initializeAuth])

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen label="Abrindo os registros do Nexo…" />}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/" element={<GameBoot><EntryRouter /></GameBoot>} />
          <Route path="/character/create" element={<GameBoot><CharacterCreationScreen /></GameBoot>} />
          <Route path="/new-game" element={<GameBoot><PrologueScreen /></GameBoot>} />
          <Route path="/terran" element={<GameBoot><TerranScreen /></GameBoot>} />
          <Route path="/terran/:locationId" element={<GameBoot><TerranLocationScreen /></GameBoot>} />
          <Route path="/nexus" element={<GameBoot><NexusScreen /></GameBoot>} />
          <Route path="/character" element={<GameBoot><CharacterScreen /></GameBoot>} />
          <Route path="/skill-tree" element={<GameBoot><SkillTreeScreen /></GameBoot>} />
          <Route path="/battle" element={<GameBoot><BattleScreen /></GameBoot>} />
          <Route path="/bound-items/:slot" element={<GameBoot><BoundItemScreen /></GameBoot>} />
          <Route path="/quests" element={<GameBoot><QuestsScreen /></GameBoot>} />
          <Route path="/npcs" element={<GameBoot><NpcsScreen /></GameBoot>} />
          <Route path="/world" element={<GameBoot><WorldScreen /></GameBoot>} />
          <Route path="/settings" element={<GameBoot><SettingsScreen /></GameBoot>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <NotificationToast />
    </BrowserRouter>
  )
}
