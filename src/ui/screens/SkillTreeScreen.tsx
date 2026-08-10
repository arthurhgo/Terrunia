import { Check, Eye, Gem, GitBranch, LockKeyhole, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { Requirement, SkillTreeNodeDefinition } from '../../content/types'
import { evaluateRequirement, getSkillNodeState, type SkillNodeState } from '../../domain/skillTree/skillTree'
import type { BoundSlot } from '../../domain/shared/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameButton } from '../components/GameButton'
import { GameShell } from '../components/GameShell'
import { ProgressBar } from '../components/ProgressBar'

type TreeContext = 'nexus' | 'clan' | 'class' | BoundSlot

const tabs: Array<{ id: TreeContext; label: string }> = [
  { id: 'nexus', label: 'Nexo' },
  { id: 'clan', label: 'Clã' },
  { id: 'class', label: 'Classe' },
  { id: 'weapon', label: 'Arma' },
  { id: 'shield', label: 'Escudo' },
  { id: 'armor', label: 'Armadura' },
  { id: 'necklace', label: 'Colar' },
  { id: 'bracelet', label: 'Pulseira' },
]

const stateLabels: Record<SkillNodeState, string> = {
  hidden: 'Oculto',
  locked: 'Bloqueado',
  discovered: 'Descoberto',
  available: 'Disponível',
  unlocked: 'Desbloqueado',
}

const requirementLabel = (requirement: Requirement) => {
  switch (requirement.type) {
    case 'boundItemPresent': return `${requirement.slot} vinculado`
    case 'boundItemGrade': return `${requirement.slot} Grau ${requirement.value}`
    case 'boundItemResonance': return `${requirement.value} de Ressonância em ${requirement.slot}`
    case 'previousNode': return `Node anterior: ${content.skillTreeNodes[requirement.nodeId]?.name ?? requirement.nodeId}`
    case 'hasEssenceTag': return `Essência com afinidade ${requirement.value}`
    case 'hasJewelId': return `Joia: ${requirement.value}`
    case 'hasRuneId': return `Runa: ${requirement.value}`
    case 'characterLevel': return `Nível ${requirement.value}`
    case 'clanId': return `Clã ${requirement.value}`
    case 'clanRank': return `Rank de Clã ${requirement.value}`
    case 'classId': return `Classe ${requirement.value}`
    case 'questCompleted': return `Missão concluída: ${requirement.questId}`
    case 'npcDiscovered': return `Conhecer NPC: ${requirement.npcId}`
    case 'memory': return `Memória: ${requirement.memoryId}`
    case 'worldFlag': return `Marco de mundo: ${requirement.flag}`
  }
}

const contextDescription: Record<TreeContext, string> = {
  nexus: 'Fundação do personagem. Conteúdo ainda não fechado.',
  clan: 'A árvore será revelada somente após filiação por gameplay.',
  class: 'A disciplina será desenvolvida dentro do Clã.',
  weapon: 'Como eu ataco: domínio, pressão, técnica e execução.',
  shield: 'Como eu me defendo e reajo: guarda, barreira e retaliação.',
  armor: 'Como eu sobrevivo e me adapto: resistência, recuperação e resiliência.',
  necklace: 'Como o poder circula: canalização, fluxo, Espírito e harmonia.',
  bracelet: 'Como o poder é executado: gesto, precisão, reação e manipulação.',
}

function TreeNode({
  node,
  state,
  selected,
  onSelect,
}: {
  node: SkillTreeNodeDefinition
  state: SkillNodeState
  selected: boolean
  onSelect: () => void
}) {
  const Icon = state === 'unlocked' ? Check : state === 'available' ? Sparkles : state === 'discovered' ? Eye : LockKeyhole
  return (
    <button
      type="button"
      className={`skill-node skill-node--${state} ${selected ? 'selected' : ''}`}
      style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
      onClick={onSelect}
      aria-label={`${node.name}: ${stateLabels[state]}`}
    >
      <span><Icon size={18} /></span>
      <small>{node.name}</small>
    </button>
  )
}

export function SkillTreeScreen() {
  const save = useGameStore((state) => state.save)
  const unlockNode = useGameStore((state) => state.unlockNode)
  const [context, setContext] = useState<TreeContext>('weapon')
  const [selectedId, setSelectedId] = useState<string>('weapon_bond_core')
  if (!save) return <Navigate to="/character/create" replace />

  const nodes = Object.values(content.skillTreeNodes).filter((node) => node.context === context)
  const visibleNodes = nodes.filter((node) => getSkillNodeState(save, node, content) !== 'hidden')
  const selected = content.skillTreeNodes[selectedId]
  const selectedState = selected && selected.context === context ? getSkillNodeState(save, selected, content) : null
  const itemId = ['weapon', 'shield', 'armor', 'necklace', 'bracelet'].includes(context)
    ? save.character.bondedEquipment[context as BoundSlot]
    : null
  const boundItem = itemId ? save.boundItems[itemId] : null
  const hiddenCount = nodes.length - visibleNodes.length

  const nodeStats = visibleNodes.reduce(
    (result, node) => {
      const state = getSkillNodeState(save, node, content)
      result[state] += 1
      return result
    },
    { hidden: 0, locked: 0, discovered: 0, available: 0, unlocked: 0 } as Record<SkillNodeState, number>,
  )

  return (
    <GameShell fluid>
      <div className="skill-tree-screen">
        <ArcanePanel className="skill-tree-header" title="Skill Tree" eyebrow="IDENTIDADE DA BUILD">
          <div className="skill-tree-header__stats">
            <div><Gem size={18} /><span>Pontos de Essência<strong>{save.essence.essencePoints}</strong></span></div>
            <ProgressBar value={save.essence.current} max={save.essence.required} label="Próximo ponto" tone="essence" compact />
            <div><GitBranch size={18} /><span>Contexto<strong>{tabs.find((tab) => tab.id === context)?.label}</strong></span></div>
            {boundItem && <div><Sparkles size={18} /><span>Vínculo<strong>G{boundItem.grade} · {boundItem.resonance} R</strong></span></div>}
          </div>
        </ArcanePanel>

        <div className="tree-tabs" role="tablist" aria-label="Árvores de progressão">
          {tabs.map((tab) => {
            const slotLocked = ['shield', 'armor', 'necklace', 'bracelet'].includes(tab.id) &&
              !save.character.bondedEquipment[tab.id as BoundSlot]
            const institutionalLocked = (tab.id === 'clan' && !save.character.clan.clanId) ||
              (tab.id === 'class' && !save.character.classProgression.classId)
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={context === tab.id}
                className={context === tab.id ? 'active' : ''}
                onClick={() => {
                  setContext(tab.id)
                  const firstNode = Object.values(content.skillTreeNodes).find((node) => node.context === tab.id)
                  setSelectedId(firstNode?.id ?? '')
                }}
              >
                {(slotLocked || institutionalLocked) && <LockKeyhole size={12} />}
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="skill-tree-layout">
          <ArcanePanel className="tree-canvas-panel" title={tabs.find((tab) => tab.id === context)?.label} subtitle={contextDescription[context]}>
            {visibleNodes.length > 0 ? (
              <div className="tree-canvas">
                <div className="grade-bands" aria-hidden="true">
                  {[7, 6, 5, 4, 3, 2, 1].map((grade) => <span key={grade}>GRAU {grade}</span>)}
                </div>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="tree-connections" aria-hidden="true">
                  <path d="M50 82 L34 58 M50 82 L66 58 M34 58 L50 32 M66 58 L50 32" />
                </svg>
                {visibleNodes.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    state={getSkillNodeState(save, node, content)}
                    selected={selectedId === node.id}
                    onSelect={() => setSelectedId(node.id)}
                  />
                ))}
                {!boundItem && ['weapon', 'shield', 'armor', 'necklace', 'bracelet'].includes(context) && (
                  <div className="tree-lock-message"><LockKeyhole size={24} /><strong>Vínculo ausente</strong><span>Obtenha esta peça dentro do jogo.</span></div>
                )}
              </div>
            ) : (
              <div className="tree-empty-state">
                <LockKeyhole size={32} />
                <h3>Caminho ainda não revelado</h3>
                <p>{contextDescription[context]}</p>
              </div>
            )}
            <div className="tree-legend">
              <span><i className="locked" /> Bloqueado {nodeStats.locked}</span>
              <span><i className="discovered" /> Descoberto {nodeStats.discovered}</span>
              <span><i className="available" /> Disponível {nodeStats.available}</span>
              <span><i className="unlocked" /> Ativo {nodeStats.unlocked}</span>
              {hiddenCount > 0 && <span><i className="hidden" /> Ocultos: {hiddenCount}</span>}
            </div>
          </ArcanePanel>

          <ArcanePanel className="node-inspector" title={selected?.name ?? 'Selecione um node'} eyebrow={selectedState ? stateLabels[selectedState].toUpperCase() : 'DETALHES'}>
            {selected && selected.context === context && selectedState ? (
              <>
                <div className={`node-inspector__sigil node-inspector__sigil--${selectedState}`}><Sparkles size={26} /></div>
                <p className="node-category">{selected.category} · {selected.status}</p>
                <p className="node-description">{selected.description}</p>
                <div className="node-cost"><Gem size={17} /><span>Custo</span><strong>{selected.costEssencePoints} ponto(s)</strong></div>
                <div className="requirements-list">
                  <p className="eyebrow">REQUISITOS</p>
                  {selected.requires.map((requirement, index) => {
                    const met = evaluateRequirement(save, requirement, content)
                    return (
                      <div key={`${requirement.type}-${index}`} className={met ? 'met' : 'unmet'}>
                        {met ? <Check size={14} /> : <LockKeyhole size={14} />}
                        <span>{requirementLabel(requirement)}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="effect-list">
                  <p className="eyebrow">EFEITOS</p>
                  {selected.effects.map((effect, index) => (
                    <div key={`${effect.type}-${index}`}>{effect.type === 'statModifier' ? `${effect.stat}: ${effect.operation === 'flat' ? '+' : '×'}${effect.value}` : effect.type}</div>
                  ))}
                </div>
                <GameButton
                  variant="primary"
                  full
                  disabled={selectedState !== 'available' || save.essence.essencePoints < selected.costEssencePoints}
                  onClick={() => unlockNode(selected.id)}
                >
                  {selectedState === 'unlocked' ? <Check size={17} /> : <Gem size={17} />}
                  {selectedState === 'unlocked' ? 'Node ativo' : 'Desbloquear node'}
                </GameButton>
              </>
            ) : (
              <div className="tree-empty-state"><Eye size={27} /><p>Selecione um node visível para inspecionar seus requisitos.</p></div>
            )}
          </ArcanePanel>
        </div>
      </div>
    </GameShell>
  )
}
