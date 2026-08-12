import { MapPin, Navigation } from 'lucide-react'
import { Link } from 'react-router-dom'
import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS } from '../../content/terran'
import {
  getDiscoveredTerranLocationIds,
  getTerranQuestDestination,
} from '../../domain/terran/cityEngine'
import { getNpcQuestMarker } from '../../domain/quests/questSelectors'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { TerranIcon } from './TerranIcon'

export function TerranMinimap({ save, compact = false }: { save: GameSave; compact?: boolean }) {
  const travel = useGameStore((state) => state.travelInTerran)
  const questDestination = getTerranQuestDestination(save, content)
  const discovered = new Set(getDiscoveredTerranLocationIds(save))

  return (
    <div className={`terran-minimap ${compact ? 'terran-minimap--compact' : ''}`}>
      <div className="terran-minimap__atmosphere" aria-hidden="true" />
      <svg className="terran-minimap__routes" viewBox="0 0 100 100" aria-hidden="true">
        {TERRAN_LOCATION_IDS.filter((locationId) => locationId !== 'location_terran_portal_plaza').map((locationId) => {
          const location = content.terranLocations[locationId]
          return (
            <line
              key={locationId}
              x1="50"
              y1="50"
              x2={location.mapPosition.x}
              y2={location.mapPosition.y}
            />
          )
        })}
        <circle cx="50" cy="50" r="18" />
      </svg>

      {TERRAN_LOCATION_IDS.map((locationId) => {
        const location = content.terranLocations[locationId]
        const isCurrent = save.world.currentLocationId === locationId
        const isObjective = questDestination?.locationId === locationId
        const isDiscovered = discovered.has(locationId)
        const npcMarker = location.npcPresences.reduce<'available' | 'turnIn' | null>((marker, presence) => {
          if (!presence.npcId) return marker
          const candidate = getNpcQuestMarker(save, presence.npcId, content)
          return candidate === 'turnIn' || !marker ? candidate : marker
        }, null)

        return (
          <Link
            key={location.id}
            to={`/terran/${location.id}`}
            className={`terran-map-node terran-map-node--${location.tone} ${isCurrent ? 'is-current' : ''} ${isObjective ? 'is-objective' : ''} ${isDiscovered ? 'is-discovered' : ''}`}
            style={{ left: `${location.mapPosition.x}%`, top: `${location.mapPosition.y}%` }}
            onClick={() => travel(location.id)}
            aria-label={`Ir para ${location.name}${isObjective ? ' — objetivo atual' : ''}`}
            aria-current={isCurrent ? 'location' : undefined}
          >
            {isObjective && <Navigation className="terran-map-node__objective" size={13} aria-hidden="true" />}
            {npcMarker && <b className={`terran-map-node__quest-marker terran-map-node__quest-marker--${npcMarker}`}>{npcMarker === 'turnIn' ? '✓' : '!'}</b>}
            <span className="terran-map-node__icon"><TerranIcon iconId={location.iconId} size={compact ? 16 : 21} /></span>
            <strong>{location.shortName}</strong>
            {!compact && <small>{location.verb}</small>}
            {isCurrent && <MapPin className="terran-map-node__player" size={14} aria-hidden="true" />}
          </Link>
        )
      })}

      <div className="terran-minimap__legend" aria-hidden="true">
        <span><i className="player" /> Você</span>
        <span><i className="objective" /> Objetivo</span>
        <span><i className="discovered" /> Descoberto</span>
      </div>
    </div>
  )
}
