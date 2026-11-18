import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AssetImage } from '../components/AssetImage'
import { getPresencePortrait } from '../../content/npcVisuals'
import { EquippedCharacter } from '../characters/EquippedCharacter'
import { content } from '../../content/catalog'
import type { TerranLocationId } from '../../content/terran'
import type { GameSave } from '../../domain/game/types'
import { getCityCast } from '../terran/cityCast'
import { getInteriorResidents } from '../terran/interiorLayout'
import { getRoomPlan } from '../terran/roomGeometry'
import { roomFurniture } from '../terran/roomContent'
import './isometricContext.css'

const positionStyle = (x: number, y: number, width: number, height: number) => ({
  left: String(100 * x / width) + '%',
  top: String(100 * y / height) + '%',
})

/** Read-only visual adapter: combat and save mutations remain inside the original domain/scene. */
export function IsometricContext({ save, selected }: { save: GameSave; selected: TerranLocationId }) {
  const [roomOpen, setRoomOpen] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const location = content.terranLocations[selected]
  const showRoom = roomOpen && location.category === 'institution'
  const residents = showRoom ? getInteriorResidents(save, selected) : []
  const furniture = showRoom ? roomFurniture[selected] : []
  const room = showRoom ? getRoomPlan(selected) : null
  const cast = getCityCast(save)
  const battle = save.battle
  const combatants = battle ? Object.values(battle.combatants) : []
  const selectedResident = residents.find(({ presence }) => presence.id === focused)
  const selectedFurniture = furniture.find((item) => item.id === focused)
  const selectedStreetNpc = cast.find((npc) => npc.id === focused)
  return (
    <section className="iso-context" aria-label="Cenas 3D de dados de gameplay">
      <header className="iso-context__head">
        <h2>{battle ? 'Arena de combate isométrica' : showRoom ? 'Interior · ' + location.name : 'NPCs de Terran'}</h2>
        {!battle && <button type="button" disabled={location.category !== 'institution'}
          onClick={() => { setRoomOpen((value) => !value); setFocused(null) }}>
          {showRoom ? 'Mostrar moradores da cidade' : 'Visualizar interior 3D'}
        </button>}
      </header>
      {battle ? (
        <div className="iso-context__battle">
          <div className="iso-context__room iso-context__room--arena">
            {combatants.map((actor) => {
              const enemies = combatants.filter((entry) => entry.side === 'enemy')
              const enemyIndex = enemies.findIndex((entry) => entry.id === actor.id)
              return <div key={actor.id} className={'iso-context__unit iso-context__unit--' + actor.side}
                style={{ left: actor.side === 'player' ? '25%' : String(59 + (enemyIndex % 3) * 13) + '%',
                  top: actor.side === 'player' ? '72%' : String(30 + Math.floor(enemyIndex / 3) * 20) + '%' }}
                title={actor.name}>
                <span className="iso-context__unit-body">{actor.side === 'player' ? <EquippedCharacter save={save} facing="right" /> : <AssetImage assetId={content.enemies[actor.definitionId]?.assetId ?? 'enemy.fungorro-crawler'} alt={actor.name} />}</span>
                <span className="iso-context__unit-name">{actor.name}</span>
              </div>
            })}
          </div>
          <p>Fase oficial: {battle.phase}</p>
          <div className="iso-context__combatants">{combatants.map((actor) =>
            <div key={actor.id}><strong>{actor.name}</strong><span>{actor.hp}/{actor.maxHp} PV</span>
              <meter min="0" max={actor.maxHp || 1} value={actor.hp} /></div>)}</div>
          <Link to="/play?view=iso">Jogar combate oficial com câmera isométrica experimental</Link>
        </div>
      ) : showRoom ? (
        <>
          <div className="iso-context__room">
            <div className="iso-context__wall iso-context__wall--top" />
            <div className="iso-context__wall iso-context__wall--side" />
            {furniture.map((item) =>
              <button key={item.id} type="button" className="iso-context__furniture"
                style={positionStyle(item.point.x, item.point.y, 384, 256)}
                title={item.description} onClick={() => setFocused(item.id)}>
                <span className="iso-context__furniture-body" />
                <span className="iso-context__unit-name">{item.name}</span>
              </button>)}
            {residents.map(({ presence, position, marker }) =>
              <button key={presence.id} type="button" className="iso-context__unit iso-context__unit--npc"
                style={positionStyle(position.x, position.y, 384, 256)}
                onClick={() => setFocused(presence.id)} title={presence.label}>
                <span className="iso-context__unit-body"><AssetImage assetId={getPresencePortrait(presence)} alt={presence.label} /></span>
                <span className="iso-context__unit-name">{marker ? String(marker) + ' · ' : ''}{presence.label}</span>
              </button>)}
            {room && <div className="iso-context__unit iso-context__unit--player"
              style={positionStyle(room.spawn.x, room.spawn.y, 384, 256)}>
              <span className="iso-context__unit-body"><EquippedCharacter save={save} facing="down" /></span>
              <span className="iso-context__unit-name">Seu Terrírian</span>
            </div>}
          </div>
          <p>{selectedResident ? selectedResident.presence.label + ' · ' + selectedResident.presence.roleLabel :
            selectedFurniture ? selectedFurniture.name + ' · ' + selectedFurniture.description :
            'Geometria, NPCs e objetos usando IDs e posições dos interiores existentes.'}</p>
          <Link to="/play">Entrar e interagir no interior funcional</Link>
        </>
      ) : (
        <>
          <div className="iso-context__roster">
            {cast.map((actor) =>
              <button type="button" key={actor.id} onClick={() => setFocused(actor.id)}
                aria-pressed={actor.id === focused}>
                <span className="iso-context__mini" />
                <strong>{actor.presence.label}</strong>
                <small>{actor.marker ?? 'NPC'} · {content.terranLocations[actor.locationId].shortName}</small>
              </button>)}
          </div>
          {selectedStreetNpc && <p>Selecionado: {selectedStreetNpc.presence.label}. A interação, missão e diálogo permanecem no motor original.</p>}
        </>
      )}
    </section>
  )
}
