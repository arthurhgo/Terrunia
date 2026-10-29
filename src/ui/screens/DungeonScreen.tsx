import { ArrowLeft, Backpack, BookOpen, Compass, DoorOpen, MapPin, Swords, X } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { dungeonRoomFlag, FUNGAL_DUNGEON_ID } from '../../domain/exploration/dungeonEngine'
import { getNextCutscene } from '../../domain/terran/cutscenes'
import { useGameStore } from '../../state/gameStore'
import { GameShell } from '../components/GameShell'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { FungalDungeonCanvas } from '../expedition/FungalDungeonCanvas'
import { CutsceneOverlay } from '../terran/CutsceneOverlay'

type Drawer = 'rooms' | 'room' | 'inventory' | 'quests' | null
const dungeon = content.dungeons.dungeon_fungal_chambers

export function DungeonScene({ unified = false }: { unified?: boolean }) {
  const save = useGameStore((state) => state.save)
  const discoverFungalRoom = useGameStore((state) => state.discoverFungalRoom)
  const exitFungalChambers = useGameStore((state) => state.exitFungalChambers)
  const startBattle = useGameStore((state) => state.startBattle)
  const recordCutsceneViewed = useGameStore((state) => state.recordCutsceneViewed)
  const [drawer, setDrawer] = useState<Drawer>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const navigate = useNavigate()

  if (!save) return <Navigate to="/character/create" replace />
  if (save.battle) return <Navigate to="/battle" replace />
  if (content.trails.trail_astravel_entry.nodes.some((node) => node.id === save.world.currentLocationId)) return <Navigate to="/expedition" replace />
  if (save.world.currentLocationId !== FUNGAL_DUNGEON_ID) return <Navigate to="/" replace />

  const scene = getNextCutscene(save)
  const discoveredFlags = save.world.worldFlags
  const completed = dungeon.rooms.filter((room) => discoveredFlags.includes(dungeonRoomFlag(room.id))).length
  const bossDefeated = save.world.trailNodeStates[dungeon.bossTrailNodeId] === 'completed'
  const bossAvailable = save.world.trailNodeStates[dungeon.bossTrailNodeId] === 'bossCurrent'
  const selectedRoom = dungeon.rooms.find((room) => room.id === selectedId)
  const quest = save.quests.vs_astravel_first_contact
  const questDefinition = content.quests.vs_astravel_first_contact
  const title = drawer === 'room' ? selectedRoom?.name ?? 'Câmaras' : drawer === 'rooms' ? 'Mapa das Salas' : drawer === 'inventory' ? 'Mochila' : 'Missões'

  const inspect = (roomId: string) => {
    discoverFungalRoom(roomId)
    setSelectedId(roomId)
    setDrawer('room')
  }
  const leave = () => {
    exitFungalChambers()
    if (!unified) navigate('/expedition')
  }
  const battle = () => {
    if (!selectedRoom || selectedRoom.kind !== 'boss' || !bossAvailable || !discoveredFlags.includes(dungeonRoomFlag(selectedRoom.id))) return
    startBattle(dungeon.bossTrailNodeId)
    if (!unified) navigate('/battle')
  }

  const sceneContent = <div className="terran-game dungeon-game">
      <header className="terran-game__topbar">
        <div><span className="eyebrow">RUÍNAS DA ENTROPIA · NÍVEL I</span><h1>Câmaras Fúngicas</h1></div>
        <div className="terran-game__readout"><MapPin size={16} /> ASTRAVÉL &gt; RUÍNA <span>{completed}/{dungeon.rooms.length} salas descobertas</span></div>
      </header>
      <div className={`terran-game__layout ${drawer ? 'has-drawer' : ''}`}>
        <section className="terran-game__stage" aria-label="Cenário contínuo do interior das Câmaras Fúngicas">
          <FungalDungeonCanvas dungeon={dungeon} discoveredFlags={discoveredFlags} bossDefeated={bossDefeated}
            portraitAssetId={save.character.portraitAssetId} reducedMotion={save.settings.reducedMotion}
            enabled={!scene} onDiscover={discoverFungalRoom} onInspect={inspect}
            onTravelStart={() => { if (drawer === 'room') { setDrawer(null); setSelectedId(null) } }} />
          <div className="terran-game__hud" aria-label="Ações na dungeon">
            {([
              { id: 'rooms' as const, label: 'Salas', icon: Compass },
              { id: 'inventory' as const, label: 'Mochila', icon: Backpack },
              { id: 'quests' as const, label: 'Missões', icon: BookOpen },
            ]).map(({ id, label, icon: Icon }) => <button key={id} type="button"
              className={drawer === id ? 'active' : ''} aria-label={`Abrir ${label}`} aria-pressed={drawer === id}
              onClick={() => { setDrawer(drawer === id ? null : id); setSelectedId(null) }}><Icon size={19} /><span>{label}</span></button>)}
          </div>
          <button type="button" className="expedition-game__retreat" onClick={leave} aria-label="Sair das Câmaras para Astravél">
            <ArrowLeft size={15} /> Astravél
          </button>
          <div className="terran-game__quest"><DoorOpen size={17} /><span>
            {bossDefeated ? 'Colosso derrotado · retorne a Terran para avançar' : 'Explore as quatro câmaras até o Núcleo da Ruína'}
            <small>WASD / setas / toque · E para inspecionar · combate por turnos</small>
          </span></div>
        </section>
        {drawer && <aside className="terran-game__drawer" aria-label={`Painel lateral: ${title}`}>
          <header><span className="eyebrow">ASTRAVÉL · PROFUNDEZAS</span><h2>{title}</h2>
            <button type="button" aria-label="Fechar painel" onClick={() => { setDrawer(null); setSelectedId(null) }}><X size={19} /></button>
          </header>
          <div className="terran-game__drawer-content">
            {drawer === 'room' && selectedRoom && <article className="expedition-node-detail">
              <span className="eyebrow">{selectedRoom.kind === 'boss' ? 'CÂMARA FINAL' : 'CÂMARA EXPLORÁVEL'} · CONTENT_DRAFT</span>
              <h3>{selectedRoom.name}</h3><p>{selectedRoom.description}</p>
              {selectedRoom.kind === 'boss' && bossAvailable && discoveredFlags.includes(dungeonRoomFlag(selectedRoom.id)) &&
                <button type="button" className="expedition-node-detail__action" onClick={battle}><Swords size={17} /> Enfrentar Colosso Micélio</button>}
              {selectedRoom.kind === 'boss' && bossDefeated && <span className="expedition-node-detail__done">✓ Colosso derrotado · memória preservada</span>}
              {selectedRoom.kind !== 'boss' && <span className="expedition-node-detail__done">✓ Sala registrada no diário de exploração</span>}
            </article>}
            {drawer === 'rooms' && <div className="expedition-route-list">
              <p>O mapa permanece na tela. Mova-se entre os corredores; cada câmara descoberta é registrada no save sem gerar itens automáticos.</p>
              {dungeon.rooms.map((room, index) => <div key={room.id} className={`expedition-route-list__item ${discoveredFlags.includes(dungeonRoomFlag(room.id)) ? 'expedition-route-list__item--completed' : ''}`}>
                <strong>{index + 1}. {room.name}</strong><small>{discoveredFlags.includes(dungeonRoomFlag(room.id)) ? 'Descoberta' : 'Desconhecida'}</small>
              </div>)}
            </div>}
            {drawer === 'inventory' && <InventoryPanel save={save} />}
            {drawer === 'quests' && <div className="expedition-route-list">
              <h3>{questDefinition.title}</h3><p>{questDefinition.summary}</p>
              <small>{quest.status.replaceAll('_', ' ').toUpperCase()}</small>
              {questDefinition.objectives.map((objective) => <div className="expedition-route-list__item" key={objective.id}>
                <strong>{objective.label}</strong><small>{Math.min(quest.objectives[objective.id] ?? 0, objective.required)}/{objective.required}</small>
              </div>)}
              <p>Missões e recompensas continuam vinculadas aos NPCs de Terran.</p>
            </div>}
          </div>
        </aside>}
      </div>
      {scene && <CutsceneOverlay key={scene.id} scene={scene} portraitAssetId={save.character.portraitAssetId}
        reducedMotion={save.settings.reducedMotion} onComplete={() => recordCutsceneViewed(scene.id)} />}
    </div>

  return unified ? sceneContent : <GameShell fluid immersive>{sceneContent}</GameShell>
}

export function DungeonScreen() {
  return <DungeonScene />
}
