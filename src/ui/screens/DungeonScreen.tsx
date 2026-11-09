import { ArrowLeft, Compass, DoorOpen, MapPin, Swords, X } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { dungeonRoomFlag, FUNGAL_DUNGEON_ID } from '../../domain/exploration/dungeonEngine'
import { FUNGAL_ROOM_IDS } from '../../content/fungalChambers'
import { getNextCutscene } from '../../domain/terran/cutscenes'
import { useGameStore } from '../../state/gameStore'
import { GameShell } from '../components/GameShell'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { FungalDungeonCanvas } from '../expedition/FungalDungeonCanvas'
import { ExpeditionStatusHud } from '../expedition/ExpeditionStatusHud'
import { deriveCharacterStats } from '../../domain/character/derivedStats'
import { getVisualEquipment } from '../characters/equipmentVisuals'
import { CutsceneOverlay } from '../terran/CutsceneOverlay'

type Drawer = 'rooms' | 'room' | 'inventory' | 'character' | 'quests' | null
const dungeon = content.dungeons.dungeon_fungal_chambers

export function DungeonScene({ unified = false }: { unified?: boolean }) {
  const save = useGameStore((state) => state.save)
  const discoverFungalRoom = useGameStore((state) => state.discoverFungalRoom)
  const exitFungalChambers = useGameStore((state) => state.exitFungalChambers)
  const startDungeonStage = useGameStore((state) => state.startDungeonStage)
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
  const run = save.dungeonRun
  const roomIndex = run?.roomIndex ?? 0
  const stageIndex = run?.stageIndex ?? 1
  const completed = run?.clearedRoomIds.length ?? 0
  const bossDefeated = run?.mode === 'won'
  const bossAvailable = run?.mode === 'boss'
  const activeRoomId = FUNGAL_ROOM_IDS[roomIndex]
  const selectedRoom = dungeon.rooms.find((room) => room.id === selectedId)
  const quest = save.quests.vs_astravel_first_contact
  const questDefinition = content.quests.vs_astravel_first_contact
  const title = drawer === 'room' ? selectedRoom?.name ?? 'Câmaras' : drawer === 'rooms' ? 'Mapa das Salas' : drawer === 'inventory' ? 'Mochila' : drawer === 'character' ? 'Personagem' : 'Missões'

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
    if (!selectedRoom || selectedRoom.id !== activeRoomId || bossDefeated) return
    startDungeonStage(selectedRoom.id)
    if (useGameStore.getState().save?.battle && !unified) navigate('/battle')
  }

  const sceneContent = <div className="terran-game dungeon-game">
      <header className="terran-game__topbar">
        <div><span className="eyebrow">RUÍNAS DA ENTROPIA · NÍVEL I</span><h1>Câmaras Fúngicas</h1></div>
        <div className="terran-game__readout"><MapPin size={16} /> ASTRAVÉL &gt; RUÍNA <span>{completed}/4 salas · ${bossAvailable ? 'Sentinela liberada' : bossDefeated ? 'Sentinela derrotada' : `Estágio ${stageIndex}/3`}</span></div>
      </header>
      <div className={`terran-game__layout ${drawer ? 'has-drawer' : ''}`}>
        <section className="terran-game__stage" aria-label="Cenário contínuo do interior das Câmaras Fúngicas">
          <FungalDungeonCanvas dungeon={dungeon} discoveredFlags={discoveredFlags} bossDefeated={bossDefeated}
            portraitAssetId={save.character.portraitAssetId} appearance={save.character.appearance} equipment={getVisualEquipment(save)} reducedMotion={save.settings.reducedMotion}
            enabled={!scene} onDiscover={discoverFungalRoom} onInspect={inspect}
            onTravelStart={() => { if (drawer === 'room') { setDrawer(null); setSelectedId(null) } }} />
          <ExpeditionStatusHud save={save} selected={drawer}
            onOpen={(tab) => { setDrawer(drawer === tab ? null : tab); setSelectedId(null) }} />
          <button type="button" className="expedition-game__route-open"
            onClick={() => { setDrawer(drawer === 'rooms' ? null : 'rooms'); setSelectedId(null) }}>
            <Compass size={14} /> Mapa das Salas
          </button>
          <button type="button" className="expedition-game__retreat" onClick={leave} aria-label="Sair das Câmaras para Astravél">
            <ArrowLeft size={15} /> Astravél
          </button>
          <div className="terran-game__quest"><DoorOpen size={17} /><span>
            {bossDefeated ? 'Sentinela Corrompida derrotada · memória preservada' : `Câmara ${roomIndex + 1}/4 · ${bossAvailable ? 'Enfrente a Sentinela Corrompida' : `Estágio ${stageIndex}/3`}`}
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
              <div className="expedition-dungeon-stage" aria-live="polite">
                <strong>{run?.clearedRoomIds.includes(selectedRoom.id) ? '✓ Sala purificada'
                  : selectedRoom.id === activeRoomId
                    ? bossAvailable ? '3/3 concluídos · Sentinela liberada' : `Estágio ${stageIndex}/3 · onda ativa`
                    : 'Sala bloqueada nesta tentativa'}</strong>
                <small>{run?.completedStageIds.filter((id) => id.startsWith(`encounter_${selectedRoom.id}_stage_`)).length ?? 0}/3 estágios vencidos</small>
              </div>
              {selectedRoom.id === activeRoomId && !bossDefeated &&
                <button type="button" className="expedition-node-detail__action" onClick={battle}>
                  <Swords size={17} /> {bossAvailable ? 'Enfrentar Núcleo da Ruína' : `Enfrentar estágio ${stageIndex}/3`}
                </button>}
              {selectedRoom.kind === 'boss' && bossDefeated && <span className="expedition-node-detail__done">✓ Sentinela Corrompida derrotada</span>}
            </article>}
            {drawer === 'rooms' && <div className="expedition-route-list">
              <p>Quatro salas, três estágios cada. Conclua a onda atual para avançar. Sair da Ruína reinicia a tentativa sem perder itens coletados.</p>
              {dungeon.rooms.map((room, index) => <div key={room.id} className={`expedition-route-list__item ${discoveredFlags.includes(dungeonRoomFlag(room.id)) ? 'expedition-route-list__item--completed' : ''}`}>
                <strong>{index + 1}. {room.name}</strong><small>{run?.clearedRoomIds.includes(room.id) ? '✓ 3/3 concluídos'
                  : room.id === activeRoomId ? (bossAvailable ? 'Chefe liberado' : `Estágio ${stageIndex}/3`) : 'Bloqueada'}</small>
              </div>)}
            </div>}
            {drawer === 'inventory' && <InventoryPanel save={save} />}
            {drawer === 'character' && <section className="expedition-field-character" aria-label="Ficha do Terrírian na dungeon">
              <h3>{save.character.name} · Nível {save.character.level}</h3>
              <p>Vida {save.vitals.hp}/{deriveCharacterStats(save, content).life.value} · Mana {save.vitals.mp}/{deriveCharacterStats(save, content).mana.value}</p>
              <dl>{Object.entries(save.character.attributes).map(([name, value]) =>
                <div key={name}><dt>{name}</dt><dd>d{value.die}{value.bonus ? ` +${value.bonus}` : ''}</dd></div>)}</dl>
            </section>}
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
      {scene && <CutsceneOverlay key={scene.id} scene={scene} portraitAssetId={save.character.portraitAssetId} appearance={save.character.appearance} equipment={getVisualEquipment(save)}
        reducedMotion={save.settings.reducedMotion} onComplete={() => recordCutsceneViewed(scene.id)} />}
    </div>

  return unified ? sceneContent : <GameShell fluid immersive>{sceneContent}</GameShell>
}

export function DungeonScreen() {
  return <DungeonScene />
}
