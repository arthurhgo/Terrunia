import { ArrowLeft, Compass, MapPin, Swords, Trees, X } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { TrailDefinition, TrailNodeDefinition } from '../../content/types'
import { ASTRAVEL_SECTORS, getAstravelSector } from '../../content/astravel'
import type { GameSave } from '../../domain/game/types'
import { getQuestJournalEntries, getQuestStatusLabel } from '../../domain/quests/questSelectors'
import { checkTrailQuestGate, getActiveTrailNode, getTrailByNodeId } from '../../domain/exploration/trailEngine'
import { getNextCutscene } from '../../domain/terran/cutscenes'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { CutsceneOverlay } from '../terran/CutsceneOverlay'
import { AstravelPixelCanvas } from '../expedition/AstravelPixelCanvas'
import { ExpeditionStatusHud } from '../expedition/ExpeditionStatusHud'
import { getVisualEquipment } from '../characters/equipmentVisuals'
import './gameplayV057.css'
import { EquippedCharacter } from '../characters/EquippedCharacter'
import { deriveCharacterStats } from '../../domain/character/derivedStats'
import { isFieldConsumable } from '../../domain/exploration/fieldConsumables'

type Drawer = 'trail' | 'node' | 'inventory' | 'character' | 'quests' | null
function NodeDrawer({ node, trail, status, save, onAction, onReturn }: {
  node: TrailNodeDefinition; trail: TrailDefinition; status: string; save: GameSave; onAction: () => void; onReturn: () => void
}) {
  const actionable = status === 'current' || status === 'bossCurrent' || (status === 'completed' && node.type === 'boss' && trail.regionId === 'astravel')
  const gate = status === 'completed' ? { ok: true as const } : checkTrailQuestGate(save, node, content)
  const encounter = node.encounterId ? content.encounters[node.encounterId] : null
  const drops = encounter ? [...new Set(encounter.rewards.lootDefinitionIds)].map((id) => content.items[id]) : []
  return <article className="expedition-node-detail">
    <span className="eyebrow">ENCONTRO {node.index}/{trail.nodes.length - 1} · {(trail.regionId === 'astravel' ? getAstravelSector(node.index).name : trail.name).toUpperCase()}</span>
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
  const consumeFieldItem = useGameStore((state) => state.consumeFieldItem)
  const enterFungalChambers = useGameStore((state) => state.enterFungalChambers)
  const returnToTerran = useGameStore((state) => state.returnToTerran)
  const recordCutsceneViewed = useGameStore((state) => state.recordCutsceneViewed)
  const [drawer, setDrawer] = useState<Drawer>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingFieldItemId, setPendingFieldItemId] = useState<string | null>(null)
  const navigate = useNavigate()

  if (!save) return <Navigate to="/character/create" replace />
  if (save.battle) return <Navigate to="/battle" replace />
  if (save.world.currentLocationId === content.dungeons.dungeon_fungal_chambers.id) return <Navigate to="/dungeon" replace />
  const trail = getTrailByNodeId(content, save.world.currentLocationId)
  if (!trail) return <Navigate to="/terran" replace />
  const isAstravel = trail.regionId === 'astravel'
  const sections = isAstravel ? ASTRAVEL_SECTORS : [{
    id: trail.regionId, name: trail.name, from: 1, to: trail.nodes.length - 1,
  }]

  const activeNode = getActiveTrailNode(save, trail)
  const scene = isAstravel ? getNextCutscene(save) : null
  const selectedNode = trail.nodes.find((node) => node.id === selectedId) ?? null
  const completed = trail.nodes.filter((node) => node.type !== 'entry' && save.world.trailNodeStates[node.id] === 'completed').length
  const quests = getQuestJournalEntries(save, content).filter(({ progress }) => progress.status !== 'completed')
  const sector = isAstravel ? getAstravelSector(activeNode?.index ?? 15) : null
  const activeGate = activeNode ? checkTrailQuestGate(save, activeNode, content) : null
  const stats = deriveCharacterStats(save, content)
  const fieldSupplies = save.inventory.filter((entry) => isFieldConsumable(save, entry.instanceId, content))

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
    if (selectedNode.type === 'boss' && isAstravel) {
      enterFungalChambers()
      if (!unified) navigate('/dungeon')
    } else if (selectedNode.type === 'battle' || selectedNode.type === 'boss') {
      engage(selectedNode.id)
    } else if (selectedNode.type === 'camp' || selectedNode.type === 'event') {
      resolveCurrentTrailNode()
      setSelectedId(null)
      setDrawer(null)
    }
  }

  const title = drawer === 'node' ? selectedNode?.label ?? 'Trilha' : drawer === 'inventory' ? 'Mochila' : drawer === 'character' ? 'Personagem' : drawer === 'quests' ? 'Missões' : 'Rota de ' + trail.name

  const sceneContent = <div className="terran-game expedition-game">
      <header className="terran-game__topbar">
        <div><span className="eyebrow">EXPEDIÇÃO · INSTÂNCIA EXTERNA</span><h1>{trail.name}</h1></div>
        <div className="terran-game__readout"><MapPin size={16} /> BIOMA &gt; {activeNode?.label.toUpperCase() ?? 'PERCURSO CONCLUÍDO'}<span>{completed}/{trail.nodes.length - 1} encontros · {sector?.name ?? trail.name}</span></div>
      </header>
      <div className={`terran-game__layout expedition-game__layout ${drawer ? 'has-drawer' : ''}`}>
        <section className="terran-game__stage" aria-label={"Cena contínua de " + trail.name}>
          <AstravelPixelCanvas key={save.world.currentLocationId} trail={trail} statuses={save.world.trailNodeStates}
            currentLocationId={save.world.currentLocationId} portraitAssetId={save.character.portraitAssetId} appearance={save.character.appearance} equipment={getVisualEquipment(save, true)}
            reducedMotion={save.settings.reducedMotion} enabled={!scene} onInspect={inspect} onEngage={engage}
            onTravelStart={() => { if (drawer === 'node') { setDrawer(null); setSelectedId(null) } }} />
          <ExpeditionStatusHud save={save} selected={drawer}
            onOpen={(tab) => { setDrawer(drawer === tab ? null : tab); setSelectedId(null); setPendingFieldItemId(null) }} />
          <button type="button" className="expedition-game__route-open"
            onClick={() => { setDrawer(drawer === 'trail' ? null : 'trail'); setSelectedId(null) }}>
            <Compass size={14}/> Trilha / 0 Entrada
          </button>
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
          <header><span className="eyebrow">{trail.name.toUpperCase()} · REGISTROS DA EXPEDIÇÃO</span><h2>{title}</h2>
            <button type="button" aria-label="Fechar painel" onClick={() => { setDrawer(null); setSelectedId(null) }}><X size={19} /></button>
          </header>
          <div className="terran-game__drawer-content">
            {drawer === 'node' && selectedNode && <NodeDrawer node={selectedNode} trail={trail} status={save.world.trailNodeStates[selectedNode.id] ?? 'locked'} save={save} onAction={act} onReturn={leave} />}
            {drawer === 'trail' && <div className="expedition-route-list">
              <p>Caminhe pelo terreno para alcançar o marco disponível. Locais bloqueados não ativam encontros nem recompensas.</p>
              {sections.map((section) => <section key={section.id} className="expedition-route-sector">
                <h3>{section.name} <small>{section.from}–{section.to}</small></h3>
                {trail.nodes.filter((node) => node.sectorId === section.id).map((node) => <button type="button" key={node.id}
                  onClick={() => inspect(node.id)} className={`expedition-route-list__item expedition-route-list__item--${save.world.trailNodeStates[node.id] ?? 'locked'}`}>
                  <strong>{node.index}. {node.label}</strong>
                  <small>{save.world.trailNodeStates[node.id] === 'completed' ? '✓ Concluído' : ['current', 'bossCurrent'].includes(save.world.trailNodeStates[node.id]) ? 'Objetivo atual' : 'Bloqueado'}</small>
                </button>)}
              </section>)}
            </div>}
            {drawer === 'character' && <section className="expedition-field-character" aria-label={"Ficha de personagem em " + trail.name}>
              <div className="expedition-field-character__identity">
                <EquippedCharacter save={save} alt={save.character.name} />
                <div><strong>{save.character.name}</strong><p>Nível {save.character.level} · {save.character.xp} XP</p>
                  <small>Clã: {save.character.clan.clanId ?? 'Não filiado'}</small>
                  <small>Classe: {save.character.classProgression.classId ?? 'Não desenvolvida'}</small>
                </div>
              </div>
              <p>Vida {save.vitals.hp}/{stats.life.value} · Mana {save.vitals.mp}/{stats.mana.value}</p>
              <h3>Atributos</h3>
              <dl>{Object.entries(save.character.attributes).map(([name, value]) =>
                <div key={name}><dt>{name}</dt><dd>d{value.die}{value.bonus ? ` +${value.bonus}` : ''}</dd></div>)}</dl>
              <small>A ficha é somente leitura na expedição; sua posição e as missões permanecem preservadas.</small>
            </section>}
            {drawer === 'inventory' && <>
              <InventoryPanel save={save} />
              <section className="expedition-field-supplies" aria-label="Usar consumíveis fora de combate">
                <h3>Consumíveis de campo</h3>
                <p>Somente itens restauradores podem ser usados fora de batalha nesta configuração provisória.</p>
                {fieldSupplies.length === 0 && <small>Nenhum suprimento restaurador disponível.</small>}
                {fieldSupplies.map((instance) => {
                  const item = content.items[instance.definitionId]
                  const effect = item.combatEffects.filter((entry) => entry.type === 'restoreHp' || entry.type === 'restoreMp')
                  const useful = effect.some((entry) =>
                    (entry.type === 'restoreHp' && save.vitals.hp < stats.life.value)
                    || (entry.type === 'restoreMp' && save.vitals.mp < stats.mana.value))
                  return <div key={instance.instanceId} className="expedition-field-supplies__item">
                    <span><strong>{item.name} ×{instance.quantity}</strong>
                    <small>{effect.map((entry) => entry.type === 'restoreHp' ? `+${entry.value} PV` : `+${entry.value} MP`).join(' · ')}</small></span>
                    {pendingFieldItemId === instance.instanceId ? <>
                      <button type="button" disabled={!useful} onClick={() => { consumeFieldItem(instance.instanceId); setPendingFieldItemId(null) }}>Confirmar uso</button>
                      <button type="button" onClick={() => setPendingFieldItemId(null)}>Voltar</button>
                    </> : <button type="button" disabled={!useful} onClick={() => setPendingFieldItemId(instance.instanceId)}>Usar</button>}
                  </div>
                })}
              </section>
            </>}
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
      {scene && <CutsceneOverlay key={scene.id} scene={scene} portraitAssetId={save.character.portraitAssetId} appearance={save.character.appearance} equipment={getVisualEquipment(save)}
        reducedMotion={save.settings.reducedMotion} onComplete={() => recordCutsceneViewed(scene.id)} />}
    </div>

  return unified ? sceneContent : <GameShell fluid immersive>{sceneContent}</GameShell>
}

export function ExpeditionScreen() {
  return <ExpeditionScene />
}
