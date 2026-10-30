import { Navigate } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'
import { GameShell } from '../components/GameShell'
import { TerranContinentMap } from '../world/TerranContinentMap'

/** Local is a discovery map, not a combat or bestiary catalogue. */
export function LocalScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />

  return <GameShell fluid>
    <main className="local-map-screen">
      <TerranContinentMap save={save} />
    </main>
  </GameShell>
}
