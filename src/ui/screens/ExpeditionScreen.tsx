import { ArrowLeft, Backpack, BookOpen, Compass, MapPin, Swords, Trees, X } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { TrailNodeDefinition } from '../../content/types'
import { getActiveTrailNode } from '../../domain/exploration/trailEngine'
import { getNextCutscene } from '../../domain/terran/cutscenes'
import { useGameStore } from '../../state/gameStore'
import { GameShell } from '../components/GameShell'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { CutsceneOverlay } from '../terran/CutsceneOverlay'
import { AstravelPixelCanvas } from '../expedition/AstravelPixelCanvas'

type Drawer = 'trail' | 'node' | 'inventory' | 'quests' | null
const trail = content.trails.trail_astravel_entry

/** CONTENT_DRAFT: environmental fragments only; all progression uses the trail definition. */
const vignettes: Record<string, string> = {
  astravel_entry: 'A luz do Portal recua. Entre as árvores rúnicas, uma trilha de terra acompanha o murmúrio da energia natural.',
  astravel_fungorro_01: 'Esporos flutuam à altura das raízes. Uma presença Fungorra interrompe o caminho à frente.',
  astravel_camp_03: 'Um abrigo abandonado resiste sob folhas luminescentes. Ainda é possível vasculhar os suprimentos.',
  astravel_spore_ambush_04: 'A vegetação escurece. Os esporos se adensam e denunciam uma emboscada.',
  astravel_ruin_threshold_05: 'Runas rompidas conduzem ao limiar subterrâneo das Câmaras Fúngicas de Astravél.',
  astravel_boss_preview: 'A praga assume forma dentro das Câmaras: o Colosso Micélio guarda a anomalia fúngica.',
}

function NodeDrawer({ node, status, onAction }: { node: TrailNodeDefinition; status: string; onAction: () => void }) {
  const actionable = status === 'current' || status === 'bossCurrent' || (status === 'completed' && node.type === 'boss')
  return <article className="expedition-node-detail">
    <span className="eyebrow">MARCO {node.index} · {status === 'completed' ? 'CONCLUÍDO' : actionable ? 'DISPONÍVEL' : 'BLOQUEADO'}</span>
    <h3>{node.label}</h3>
    <p>{vignettes[node.id]}</p>
    {actionable && node.type !== 'entry' && <button type="button" onClick={onAction} className="expedition-node-detail__action">
      {node.type === 'battle' ? <Swords size={17} /> : <Compass size={17} />}
      {node.type === 'boss' ? 'Adentrar Câmaras Fúngicas' : node.actionLabel ?? node.interaction?.actionLabel ?? 'Explorar'}
    </button>}
    {status === 'completed' && <span className="expedition-node-detail__done">✓ Registro preservado na campanha</span>}
  </article>
}

export function ExpeditionScreen() {
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
  const completed = trail.nodes.filter((node) => save.world.trailNodeStates[node.id] === 'completed').length
  const quest = save.quests.vs_astravel_first_contact
  const questDefinition = content.quests.vs_astravel_first_contact

  const leave = () => { returnToTerran(); navigate('/terran') }
  const inspect = (nodeId: string) => { setSelectedId(nodeId); setDrawer('node') }
  const act = () => {
    if (!selectedNode || !['current', 'bossCurrent'].includes(save.world.trailNodeStates[selectedNode.id] ?? '')
      && !(selectedNode.type === 'boss' && save.world.trailNodeStates[selectedNode.id] === 'completed')) return
    if (selectedNode.type === 'boss') {
      enterFungalChambers()
      navigate('/dungeon')
    } else if (selectedNode.type === 'battle') {
      startBattle(selectedNode.id)
      navigate('/battle')
    } else if (selectedNode.type === 'camp' || selectedNode.type === 'event') {
      resolveCurrentTrailNode()
      setSelectedId(null)
      setDrawer(null)
    }
  }

  const title = drawer === 'node' ? selectedNode?.label ?? 'Trilha' : drawer === 'inventory' ? 'Mochila' : drawer === 'quests' ? 'Missões' : 'Rota de Astravél'

  return <GameShell fluid immersive>
    <div className="terran-game expedition-game">
      <header className="terran-game__topbar">
        <div><span className="eyebrow">EXPEDIÇÃO · INSTÂNCIA EXTERNA</span><h1>Astravél</h1></div>
        <div className="terran-game__readout"><MapPin size={16} /> FLORESTA &gt; {activeNode?.label.toUpperCase() ?? 'CÂMARAS FÚNGICAS'}<span>{completed}/{trail.nodes.length} marcos</span></div>
      </header>
      <div className={`terran-game__layout ${drawer ? 'has-drawer' : ''}`}>
        <section className="terran-game__stage" aria-label="Cena contínua de Astravél">
          <AstravelPixelCanvas trail={trail} statuses={save.world.trailNodeStates}
            currentLocationId={save.world.currentLocationId} portraitAssetId={save.character.portraitAssetId}
            reducedMotion={save.settings.reducedMotion} enabled={!scene} onInspect={inspect}
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
              <small>WASD / setas / toque para caminhar · E para investigar · combate por turnos</small></span>
          </div>
        </section>
        {drawer && <aside className="terran-game__drawer" aria-label={`Painel lateral: ${title}`}>
          <header><span className="eyebrow">ASTRAVÉL · REGISTROS DA EXPEDIÇÃO</span><h2>{title}</h2>
            <button type="button" aria-label="Fechar painel" onClick={() => { setDrawer(null); setSelectedId(null) }}><X size={19} /></button>
          </header>
          <div className="terran-game__drawer-content">
            {drawer === 'node' && selectedNode && <NodeDrawer node={selectedNode} status={save.world.trailNodeStates[selectedNode.id] ?? 'locked'} onAction={act} />}
            {drawer === 'trail' && <div className="expedition-route-list">
              <p>Caminhe pelo terreno para alcançar o marco disponível. Locais bloqueados não ativam encontros nem recompensas.</p>
              {trail.nodes.map((node) => <div key={node.id} className={`expedition-route-list__item expedition-route-list__item--${save.world.trailNodeStates[node.id] ?? 'locked'}`}>
                <strong>{node.index}. {node.label}</strong>
                <small>{save.world.trailNodeStates[node.id] === 'completed' ? 'Concluído' : ['current', 'bossCurrent'].includes(save.world.trailNodeStates[node.id]) ? 'Objetivo atual' : 'Não acessível'}</small>
              </div>)}
            </div>}
            {drawer === 'inventory' && <InventoryPanel save={save} />}
            {drawer === 'quests' && <div className="expedition-route-list">
              <h3>{questDefinition.title}</h3><p>{questDefinition.summary}</p>
              <small>{quest.status.replaceAll('_', ' ').toUpperCase()}</small>
              {questDefinition.objectives.map((objective) => <div className="expedition-route-list__item" key={objective.id}>
                <strong>{objective.label}</strong><small>{Math.min(quest.objectives[objective.id] ?? 0, objective.required)}/{objective.required}</small>
              </div>)}
              <p>As recompensas da missão exigem retorno ao NPC responsável em Terran.</p>
            </div>}
          </div>
        </aside>}
      </div>
      {scene && <CutsceneOverlay key={scene.id} scene={scene} portraitAssetId={save.character.portraitAssetId}
        reducedMotion={save.settings.reducedMotion} onComplete={() => recordCutsceneViewed(scene.id)} />}
    </div>
  </GameShell>
}
