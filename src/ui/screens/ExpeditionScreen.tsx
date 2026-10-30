import { ArrowLeft, Backpack, BookOpen, Compass, MapPin, Swords, Trees, X } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { TrailNodeDefinition } from '../../content/types'
import { ASTRAVEL_SECTORS, getAstravelSector } from '../../content/astravel'
import type { GameSave } from '../../domain/game/types'
import { getQuestJournalEntries, getQuestStatusLabel } from '../../domain/quests/questSelectors'
import { checkTrailQuestGate, getActiveTrailNode } from '../../domain/exploration/trailEngine'
import { getNextCutscene } from '../../domain/terran/cutscenes'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { CutsceneOverlay } from '../terran/CutsceneOverlay'
import { AstravelPixelCanvas } from '../expedition/AstravelPixelCanvas'

type Drawer = 'trail' | 'node' | 'inventory' | 'quests' | null
const trail = content.trails.trail_astravel_entry

function NodeDrawer({ node, status, save, onAction, onReturn }: {
  node: TrailNodeDefinition; status: string; save: GameSave; onAction: () => void; onReturn: () => void
}) {
  const actionable = status === 'current' || status === 'bossCurrent' || (status === 'completed' && node.type === 'boss')
  const gate = status === 'completed' ? { ok: true as const } : checkTrailQuestGate(save, node, content)
  const encounter = node.encounterId ? content.encounters[node.encounterId] : null
  const drops = encounter ? [...new Set(encounter.rewards.lootDefinitionIds)].map((id) => content.items[id]) : []
  return <article className="expedition-node-detail">
    <span className="eyebrow">ENCONTRO {node.index}/15 · {getAstravelSector(node.index).name.toUpperCase()}</span>
    <h3>{node.label}</h3><p>{node.description}</p>
    {node.tacticalHint && <p className="expedition-tactic">{node.tacticalHint}</p>}
    {encounter && <>
      <div className="expedition-enemies" aria-label="Criaturas deste encontro">
        {encounter.enemyDefinitionIds.map((id, index) => <span key={`${id}_${index}`}>
          <AssetImage assetId={content.enemies[id].assetId} /><small>{content.enemies[id].name}</small>
        </span>)}
      </div>
      <small>Nível sugerido {node.recommendedLevel} · {encounter.rewards.characterXp} XP · {encounter.rewards.gold} Ouro · {encounter.rewards.boundResonance} Ressonância</small>
      <div className="expedition-drops"><span className="eyebrow">MATERIAIS E SUPRIMENTOS</span>
        {drops.map((item) => <span key={item.id}><AssetImage assetId={item.iconAssetId} />{item.name}</span>)}
      </div>
    </>}
    {!gate.ok && <div className="expedition-quest-gate"><p>{gate.message}</p><button type="button" onClick={onReturn}>Retornar a Terran</button></div>}
    {actionable && gate.ok && node.type !== 'entry' && <button type="button" onClick={onAction} className="expedition-node-detail__action">
      {node.type === 'battle' ? <Swords size={17} /> : <Compass size={17} />}
      {node.type === 'boss' ? 'Adentrar Câmaras Fúngicas' : node.actionLabel ?? 'Explorar'}
    </button>}
    {status === 'completed' && <span className="expedition-node-detail__done">✓ Registro preservado na campanha</span>}
  </article>
}

export function ExpeditionScene({ unified = false }: { unified?: boolean }) {
  const save = useGameStore((state) => state.save)
  const resolveCurrentTrailNode = useGameStore((state) => state.resolveCurrentTrailNode)
  const startBattle = useGameStore((state) => state.startBattle)
  const enterFungalChambers = useGameStore((state) => state.enterFungalChambers)
  const returnToTerran = useGameStore((state) => state.returnToTerran)
  const recordCutsceneViewed = useGameStore((state) => state.recordCutsceneViewed)
  const [drawer, setDrawer] = useState<Drawer>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const navigate = useNavigate()

  if (!save) return <Navigate to="/character/create" replace />
  if (save.battle) return <Navigate to="/battle" replace />
  if (save.world.currentLocationId === content.dungeons.dungeon_fungal_chambers.id) return <Navigate to="/dungeon" replace />
  if (!trail.nodes.some((node) => node.id === save.world.currentLocationId)) return <Navigate to="/terran" replace />

  const activeNode = getActiveTrailNode(save, trail)
  const scene = getNextCutscene(save)
  const selectedNode = trail.nodes.find((node) => node.id === selectedId) ?? null
  const completed = trail.nodes.filter((node) => node.type !== 'entry' && save.world.trailNodeStates[node.id] === 'completed').length
  const quests = getQuestJournalEntries(save, content).filter(({ progress }) => progress.status !== 'completed')
  const sector = getAstravelSector(activeNode?.index ?? 15)
  const activeGate = activeNode ? checkTrailQuestGate(save, activeNode, content) : null

  const leave = () => {
    returnToTerran()
    if (!unified) navigate('/terran')
  }
  const inspect = (nodeId: string) => { setSelectedId(nodeId); setDrawer('node') }
  const engage = (nodeId: string): boolean => {
    // The store enforces current trail status, encounter content, and remaining HP.
    // In the unified viewport, the persistent scene switches to combat automatically.
    const node = trail.nodes.find((candidate) => candidate.id === nodeId)
    if (node && !checkTrailQuestGate(save, node, content).ok) { inspect(nodeId); return false }
    startBattle(nodeId)
    const started = Boolean(useGameStore.getState().save?.battle)
    if (started && !unified) navigate('/battle')
    return started
  }
  const act = () => {
    if (!selectedNode || !['current', 'bossCurrent'].includes(save.world.trailNodeStates[selectedNode.id] ?? '')
      && !(selectedNode.type === 'boss' && save.world.trailNodeStates[selectedNode.id] === 'completed')) return
    if (selectedNode.type === 'boss') {
      enterFungalChambers()
      if (!unified) navigate('/dungeon')
    } else if (selectedNode.type === 'battle') {
      engage(selectedNode.id)
    } else if (selectedNode.type === 'camp' || selectedNode.type === 'event') {
      resolveCurrentTrailNode()
      setSelectedId(null)
      setDrawer(null)
    }
  }

  const title = drawer === 'node' ? selectedNode?.label ?? 'Trilha' : drawer === 'inventory' ? 'Mochila' : drawer === 'quests' ? 'Missões' : 'Rota de Astravél'

  const sceneContent = <div className="terran-game expedition-game">
      <header className="terran-game__topbar">
        <div><span className="eyebrow">EXPEDIÇÃO · INSTÂNCIA EXTERNA</span><h1>Astravél</h1></div>
        <div className="terran-game__readout"><MapPin size={16} /> FLORESTA &gt; {activeNode?.label.toUpperCase() ?? 'CÂMARAS FÚNGICAS'}<span>{completed}/15 combates · {sector.name}</span></div>
      </header>
      <div className={`terran-game__layout expedition-game__layout ${drawer ? 'has-drawer' : ''}`}>
        <section className="terran-game__stage" aria-label="Cena contínua de Astravél">
          <AstravelPixelCanvas key={save.world.currentLocationId} trail={trail} statuses={save.world.trailNodeStates}
            currentLocationId={save.world.currentLocationId} portraitAssetId={save.character.portraitAssetId}
            reducedMotion={save.settings.reducedMotion} enabled={!scene} onInspect={inspect} onEngage={engage}
            onTravelStart={() => { if (drawer === 'node') { setDrawer(null); setSelectedId(null) } }} />
          <div className="terran-game__hud" aria-label="Ações de exploração">
            {([
              { id: 'trail' as const, label: 'Trilha', icon: Compass },
              { id: 'inventory' as const, label: 'Mochila', icon: Backpack },
              { id: 'quests' as const, label: 'Missões', icon: BookOpen },
            ]).map(({ id, label, icon: Icon }) => <button key={id} type="button"
              className={drawer === id ? 'active' : ''} aria-label={`Abrir ${label}`} aria-pressed={drawer === id}
              onClick={() => { setDrawer(drawer === id ? null : id); setSelectedId(null) }}><Icon size={19} /><span>{label}</span></button>)}
          </div>
          <button type="button" className="expedition-game__retreat" onClick={leave} aria-label="Retornar a Terran pelo Portal">
            <ArrowLeft size={15} /> Terran
          </button>
          <div className="terran-game__quest"><Trees size={17} />
            <span>{activeNode ? `Siga até: ${activeNode.label}` : 'Expedição concluída · retorne a Terran'}
              <small>{activeGate && !activeGate.ok ? activeGate.message : 'WASD / setas / toque para caminhar · E para investigar · combate por turnos'}</small></span>
          </div>
        </section>
        {drawer && <>
          <button type="button" className="expedition-game__drawer-backdrop"
            aria-label="Fechar janela da instância" onClick={() => { setDrawer(null); setSelectedId(null) }} />
          <aside className="terran-game__drawer expedition-game__window" aria-label={`Painel lateral: ${title}`}>
          <header><span className="eyebrow">ASTRAVÉL · REGISTROS DA EXPEDIÇÃO</span><h2>{title}</h2>
            <button type="button" aria-label="Fechar painel" onClick={() => { setDrawer(null); setSelectedId(null) }}><X size={19} /></button>
          </header>
          <div className="terran-game__drawer-content">
            {drawer === 'node' && selectedNode && <NodeDrawer node={selectedNode} status={save.world.trailNodeStates[selectedNode.id] ?? 'locked'} save={save} onAction={act} onReturn={leave} />}
            {drawer === 'trail' && <div className="expedition-route-list">
              <p>Caminhe pelo terreno para alcançar o marco disponível. Locais bloqueados não ativam encontros nem recompensas.</p>
              {ASTRAVEL_SECTORS.map((section) => <section key={section.id} className="expedition-route-sector">
                <h3>{section.name} <small>{section.from}–{section.to}</small></h3>
                {trail.nodes.filter((node) => node.sectorId === section.id).map((node) => <button type="button" key={node.id}
                  onClick={() => inspect(node.id)} className={`expedition-route-list__item expedition-route-list__item--${save.world.trailNodeStates[node.id] ?? 'locked'}`}>
                  <strong>{node.index}. {node.label}</strong>
                  <small>{save.world.trailNodeStates[node.id] === 'completed' ? '✓ Concluído' : ['current', 'bossCurrent'].includes(save.world.trailNodeStates[node.id]) ? 'Objetivo atual' : 'Bloqueado'}</small>
                </button>)}
              </section>)}
            </div>}
            {drawer === 'inventory' && <InventoryPanel save={save} />}
            {drawer === 'quests' && <div className="expedition-route-list">
              {quests.length === 0 && <p>Converse com os responsáveis em Terran para aceitar a próxima missão.</p>}
              {quests.map(({ definition, progress }) => <section key={definition.id} className="expedition-route-sector">
                <h3>{definition.title}</h3><p>{definition.summary}</p>
                <small>{getQuestStatusLabel(progress.status)} · Entrega: {content.npcs[definition.turnInNpcId].name}</small>
                {definition.objectives.map((objective) => <div className="expedition-route-list__item" key={objective.id}>
                  <strong>{objective.label}</strong><small>{Math.min(progress.objectives[objective.id] ?? 0, objective.required)}/{objective.required}</small>
                </div>)}
              </section>)}
              <p>Entregue a missão ao NPC responsável para receber a recompensa e abrir a próxima etapa.</p>
            </div>}
          </div>
          </aside>
        </>}
      </div>
      {scene && <CutsceneOverlay key={scene.id} scene={scene} portraitAssetId={save.character.portraitAssetId}
        reducedMotion={save.settings.reducedMotion} onComplete={() => recordCutsceneViewed(scene.id)} />}
    </div>

  return unified ? sceneContent : <GameShell fluid immersive>{sceneContent}</GameShell>
}

export function ExpeditionScreen() {
  return <ExpeditionScene />
}
