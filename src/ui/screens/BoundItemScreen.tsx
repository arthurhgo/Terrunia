import { Check, Gem, LockKeyhole, MapPin, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { content } from '../../content/catalog'
import {
  getBoundSlotCapacity,
  getGradeThreeGemCandidates,
  getGradeTwoInfusionCandidates,
} from '../../domain/bond/boundItems'
import { BOUND_SLOT_LABELS, BOUND_SLOTS, type BoundSlot, type Effect } from '../../domain/shared/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'
import { GameShell } from '../components/GameShell'
import { Modal } from '../components/Modal'
import { ProgressBar } from '../components/ProgressBar'

type RiteTarget = 2 | 3 | null

const statLabels: Record<Extract<Effect, { type: 'statModifier' }>['stat'], string> = {
  attackPower: 'Poder de ataque',
  mitigation: 'Mitigação',
  maxHp: 'Vida máxima',
  initiative: 'Iniciativa',
  essenceGain: 'Ganho de Essência',
}

const effectLabel = (effect: Effect) => {
  switch (effect.type) {
    case 'statModifier':
      return `${statLabels[effect.stat]} ${effect.operation === 'flat' ? '+' : '×'}${effect.value}`
    case 'unlockSkill':
      return `Habilidade: ${content.combatSkills[effect.skillId]?.name ?? effect.skillId}`
    case 'unlockReaction':
      return `Reação: ${effect.reactionId}`
    case 'resonanceModifier':
      return `Ressonância ${effect.operation === 'flat' ? '+' : '×'}${effect.value}`
  }
}

export function BoundItemScreen() {
  const { slot } = useParams()
  const save = useGameStore((state) => state.save)
  const evolveToGradeTwo = useGameStore((state) => state.performGradeTwoRite)
  const evolveToGradeThree = useGameStore((state) => state.performGradeThreeRite)
  const [riteTarget, setRiteTarget] = useState<RiteTarget>(null)
  const [selectedGemInstanceId, setSelectedGemInstanceId] = useState('')
  if (!save || !BOUND_SLOTS.includes(slot as BoundSlot)) return <Navigate to="/terran" replace />

  const boundSlot = slot as BoundSlot
  const itemId = save.character.bondedEquipment[boundSlot]
  const item = itemId ? save.boundItems[itemId] : null
  if (!item) return <Navigate to="/terran" replace />

  const definition = content.boundItemBases[item.baseItemId]
  const capacity = getBoundSlotCapacity(item.grade)
  const infusionCandidates = getGradeTwoInfusionCandidates(save, content)
  const fragment = infusionCandidates[0]
  const fragmentDefinition = fragment ? content.items[fragment.definitionId] : null
  const essence = fragmentDefinition?.infusionComponentId
    ? content.essences[fragmentDefinition.infusionComponentId]
    : null
  const gemCandidates = getGradeThreeGemCandidates(save, item.id, content)
  const selectedGemCandidate =
    gemCandidates.find((candidate) => candidate.inventoryInstanceId === selectedGemInstanceId) ??
    gemCandidates[0]
  const gemItemDefinition = selectedGemCandidate
    ? content.items[selectedGemCandidate.itemDefinitionId]
    : null
  const gem = selectedGemCandidate ? content.gems[selectedGemCandidate.gemId] : null
  const resonanceReady = item.resonance >= item.resonanceThreshold
  const inTerran = save.world.currentLocationId === 'terran'
  const gradeTwoReady = item.grade === 1 && resonanceReady && inTerran && Boolean(fragment && essence)
  const gradeThreeReady = item.grade === 2 && resonanceReady && inTerran && Boolean(selectedGemCandidate)

  const openGradeThreeRite = () => {
    setSelectedGemInstanceId(gemCandidates[0]?.inventoryInstanceId ?? '')
    setRiteTarget(3)
  }

  const confirmRite = () => {
    if (riteTarget === 2 && fragment) {
      evolveToGradeTwo(item.id, fragment.instanceId)
      setRiteTarget(null)
    }
    if (riteTarget === 3 && selectedGemCandidate) {
      evolveToGradeThree(item.id, selectedGemCandidate.inventoryInstanceId)
      setRiteTarget(null)
    }
  }

  const riteComponentName = item.grade === 1
    ? fragmentDefinition?.name ?? 'Fragmento pendente'
    : gem?.name ?? 'Joia compatível pendente'
  const riteComponentReady = item.grade === 1 ? Boolean(fragment) : Boolean(selectedGemCandidate)

  return (
    <GameShell>
      <div className="bound-detail-screen">
        <ArcanePanel title={definition.name} eyebrow={`${BOUND_SLOT_LABELS[boundSlot].toUpperCase()} VINCULADA`} className="bound-detail-hero">
          <div className="bound-detail-visual">
            <AssetImage assetId={definition.assetIdByGrade[item.grade] ?? definition.assetIdByGrade[1] ?? ''} />
            <span className="grade-seal">GRAU<strong>{item.grade}</strong></span>
          </div>
          <div className="bound-detail-data">
            <p>{definition.status} · arquétipo {definition.archetype}</p>
            <ProgressBar value={item.resonance} max={item.resonanceThreshold} label="Ressonância" tone="resonance" />
            <div className="bound-detail-actions">
              <Link to="/skill-tree" className="game-button game-button--primary"><Sparkles size={17} /> Abrir Skill Tree</Link>
              {item.grade === 1 ? (
                <GameButton variant="secondary" disabled={!gradeTwoReady} onClick={() => setRiteTarget(2)}>
                  {gradeTwoReady ? <Sparkles size={17} /> : <LockKeyhole size={17} />}
                  {gradeTwoReady ? 'Executar Rito G2' : 'Rito G2 bloqueado'}
                </GameButton>
              ) : item.grade === 2 ? (
                <GameButton variant="secondary" disabled={!gradeThreeReady} onClick={openGradeThreeRite}>
                  {gradeThreeReady ? <Gem size={17} /> : <LockKeyhole size={17} />}
                  {gradeThreeReady ? 'Executar Rito G3' : 'Rito G3 bloqueado'}
                </GameButton>
              ) : (
                <GameButton variant="ghost" disabled><Check size={17} /> Grau III concluído</GameButton>
              )}
            </div>
          </div>
        </ArcanePanel>

        <div className="bound-detail-grid">
          <ArcanePanel title="Estrutura" eyebrow="SETE GRAUS">
            <div className="component-detail-grid">
              <div className={capacity.essences ? 'active' : ''}><Gem size={18} /><span>Essências<strong>{item.components.essences.length}/{capacity.essences}</strong></span></div>
              <div className={capacity.gems ? 'active' : ''}><Gem size={18} /><span>Joias<strong>{item.components.gems.length}/{capacity.gems}</strong></span></div>
              <div className={capacity.runes ? 'active' : ''}><Sparkles size={18} /><span>Runa<strong>{item.components.runeId ? '1' : '0'}/{capacity.runes}</strong></span></div>
              <div className={capacity.superiorRunes ? 'active' : ''}><Sparkles size={18} /><span>Runa Superior<strong>{item.components.superiorRuneId ? '1' : '0'}/{capacity.superiorRunes}</strong></span></div>
            </div>
            <p className="field-hint">Grau expande capacidade. Nodes definem especialização.</p>
            {(item.components.essences.length > 0 || item.components.gems.length > 0) && (
              <div className="bound-component-list">
                {item.components.essences.map((componentId) => (
                  <div key={componentId}>
                    <Gem size={17} />
                    <span><strong>{content.essences[componentId]?.name ?? componentId}</strong><small>Essência incorporada</small></span>
                  </div>
                ))}
                {item.components.gems.map((componentId) => (
                  <div key={componentId} className="bound-component--gem">
                    <Gem size={17} />
                    <span><strong>{content.gems[componentId]?.name ?? componentId}</strong><small>Joia lapidada · efeito ativo</small></span>
                  </div>
                ))}
              </div>
            )}
          </ArcanePanel>
          <ArcanePanel title="Memórias" eyebrow="HISTÓRIA DO VÍNCULO">
            <div className="memory-list">
              {item.memories.map((memory) => (
                <article key={memory.id}><Sparkles size={17} /><div><strong>{memory.title}</strong><p>{memory.description}</p></div></article>
              ))}
            </div>
          </ArcanePanel>
          {(item.grade === 1 || item.grade === 2) && (
            <ArcanePanel
              title={`Rito do Grau ${item.grade === 1 ? 'II' : 'III'}`}
              eyebrow={item.grade === 1 ? 'PRIMEIRA INFUSÃO' : 'PRIMEIRA LAPIDAÇÃO'}
              className="rite-readiness-panel"
            >
              <div className="rite-requirements">
                <div className={resonanceReady ? 'met' : 'unmet'}>
                  {resonanceReady ? <Check size={16} /> : <LockKeyhole size={16} />}
                  <span>Ressonância mínima<strong>{item.resonance}/{item.resonanceThreshold}</strong></span>
                </div>
                <div className={inTerran ? 'met' : 'unmet'}>
                  {inTerran ? <Check size={16} /> : <MapPin size={16} />}
                  <span>Retorno ao hub<strong>Terran</strong></span>
                </div>
                <div className={riteComponentReady ? 'met' : 'unmet'}>
                  {riteComponentReady ? <Check size={16} /> : <LockKeyhole size={16} />}
                  <span>{item.grade === 1 ? 'Componente infusível' : 'Joia compatível'}<strong>{riteComponentName}</strong></span>
                </div>
              </div>
              <p className="modal-warning">O NPC e o local definitivo do rito permanecem OWNER_DECISION. Neste build, Terran executa o serviço técnico sem definir lore nova.</p>
            </ArcanePanel>
          )}
        </div>
      </div>

      <Modal
        open={riteTarget !== null}
        onClose={() => setRiteTarget(null)}
        eyebrow="RITO DE EVOLUÇÃO"
        title={riteTarget === 3 ? 'Lapidar a primeira Joia' : 'Infundir o primeiro Fragmento'}
        footer={
          <>
            <GameButton variant="ghost" onClick={() => setRiteTarget(null)}>Cancelar</GameButton>
            <GameButton
              variant="primary"
              onClick={confirmRite}
              disabled={riteTarget === 3 ? !gradeThreeReady : !gradeTwoReady}
            >
              {riteTarget === 3 ? <Gem size={16} /> : <Sparkles size={16} />}
              {riteTarget === 3 ? 'Confirmar Lapidação' : 'Confirmar Infusão'}
            </GameButton>
          </>
        }
      >
        {riteTarget === 3 ? (
          <>
            {gemCandidates.length > 1 && (
              <div className="gem-candidate-list" aria-label="Joias compatíveis">
                {gemCandidates.map((candidate) => {
                  const candidateGem = content.gems[candidate.gemId]
                  const selected = candidate.inventoryInstanceId === selectedGemCandidate?.inventoryInstanceId
                  return (
                    <button
                      type="button"
                      key={candidate.inventoryInstanceId}
                      className={selected ? 'selected' : ''}
                      aria-pressed={selected}
                      onClick={() => setSelectedGemInstanceId(candidate.inventoryInstanceId)}
                    >
                      <AssetImage assetId={candidateGem.iconAssetId} />
                      <span>{candidateGem.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
            <div className="rite-preview">
              <AssetImage assetId={gemItemDefinition?.iconAssetId ?? 'gem.emerald-growth'} />
              <div>
                <p className="eyebrow">JOIA COMPATÍVEL</p>
                <h3>{gem?.name ?? 'Joia não identificada'}</h3>
                <p>{gem?.description}</p>
              </div>
            </div>
            <div className="component-effect-preview">
              <p className="eyebrow">EFEITOS AO INSERIR</p>
              {gem?.modifiers.length ? (
                gem.modifiers.map((effect, index) => <span key={`${effect.type}-${index}`}>{effectLabel(effect)}</span>)
              ) : (
                <span>Efeito numérico ainda não balanceado</span>
              )}
            </div>
            <div className="rite-outcome-grid">
              <span><small>Grau</small><strong>II → III</strong></span>
              <span><small>Slot</small><strong>Joia 1/1</strong></span>
              <span><small>Árvore</small><strong>{gem?.skillTreeHooks.length ?? 0} node(s) revelado(s)</strong></span>
            </div>
          </>
        ) : (
          <>
            <div className="rite-preview">
              <AssetImage assetId={fragmentDefinition?.iconAssetId ?? 'item.mycelial-fragment'} />
              <div>
                <p className="eyebrow">COMPONENTE</p>
                <h3>{essence?.name ?? 'Essência não identificada'}</h3>
                <p>{essence?.description}</p>
              </div>
            </div>
            <div className="rite-outcome-grid">
              <span><small>Grau</small><strong>I → II</strong></span>
              <span><small>Slot</small><strong>Essência 1/1</strong></span>
              <span><small>Árvore</small><strong>{essence?.skillTreeHooks.length ?? 0} node(s) revelado(s)</strong></span>
            </div>
          </>
        )}
        <p className="modal-warning">A remoção ou substituição de componentes permanece OWNER_DECISION. Esta evolução é tratada como permanente neste marco.</p>
      </Modal>
    </GameShell>
  )
}
