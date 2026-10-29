import { Navigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { getWorldScene } from '../../domain/world/worldScene'
import { useGameStore } from '../../state/gameStore'
import { GameShell } from '../components/GameShell'
import { SceneTransitionOverlay } from '../world/SceneTransitionOverlay'
import { BattleScene } from './BattleScreen'
import { DungeonScene } from './DungeonScreen'
import { ExpeditionScene } from './ExpeditionScreen'
import { TerranScene } from './TerranScreen'

/**
 * Persistent root for city, expedition, dungeon and combat.
 * The route and GameShell stay mounted while only the scene inside the viewport changes.
 */
export function UnifiedWorldScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />
  if (!save.character.bondedEquipment.weapon) return <Navigate to="/new-game" replace />

  const scene = getWorldScene(save, content)
  return (
    <GameShell fluid immersive>
      <div className={`world-scene world-scene--${scene.kind}`} data-scene={scene.kind}>
        <div className="world-scene__content">
          {scene.kind === 'terran' ? <TerranScene unified /> : null}
          {scene.kind === 'expedition' ? <ExpeditionScene unified /> : null}
          {scene.kind === 'dungeon' ? <DungeonScene unified /> : null}
          {scene.kind === 'combat' ? <BattleScene unified /> : null}
        </div>
        <SceneTransitionOverlay scene={scene} reducedMotion={save.settings.reducedMotion} />
      </div>
    </GameShell>
  )
}
