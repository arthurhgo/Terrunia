import { Navigate } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'
import { GameShell } from '../components/GameShell'
import { NexusOverview } from '../dashboard/NexusOverview'

/** Character status has its own destination, separate from the inventory. */
export function NexusScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />
  return <GameShell fluid><section className="nexus-screen"><header className="screen-heading"><p className="eyebrow">FICHA DE COMBATE</p><h1>Nexo do personagem</h1></header><NexusOverview save={save} /></section></GameShell>
}
