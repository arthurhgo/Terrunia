import { Check, Gem, LockKeyhole, MapPin, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { content } from '../../content/catalog'
import {
  getBoundSlotCapacity,
  getGradeTwoInfusionCandidates,
} from '../../domain/bond/boundItems'
import { BOUND_SLOT_LABELS, BOUND_SLOTS, type BoundSlot } from '../../domain/shared/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'
import { GameShell } from '../components/GameShell'
import { Modal } from '../components/Modal'
import { ProgressBar } from '../components/ProgressBar'

export function BoundItemScreen() {
  const { slot } = useParams()
  const save = useGameStore((state) => state.save)
  const evolveToGradeTwo = useGameStore((state) => state.performGradeTwoRite)
  const [riteOpen, setRiteOpen] = useState(false)
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
  const resonanceReady = item.resonance >= item.resonanceThreshold
  const inTerran = save.world.currentLocationId === 'terran'
  const gradeTwoReady = item.grade === 1 && resonanceReady && inTerran && Boolean(fragment && essence)

  const confirmGradeTwo = () => {
    if (!fragment) return
    evolveToGradeTwo(item.id, fragment.instanceId)
    setRiteOpen(false)
  }

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
                <GameButton variant="secondary" disabled={!gradeTwoReady} onClick={() => setRiteOpen(true)}>
                  {gradeTwoReady ? <Sparkles size={17} /> : <LockKeyhole size={17} />}
                  {gradeTwoReady ? 'Executar Rito G2' : 'Rito G2 bloqueado'}
                </GameButton>
              ) : (
                <GameButton variant="ghost" disabled><Check size={17} /> Grau II concluído</GameButton>
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
            {item.components.essences.length > 0 && (
              <div className="bound-component-list">
                {item.components.essences.map((componentId) => (
                  <div key={componentId}>
                    <Gem size={17} />
                    <span><strong>{content.essences[componentId]?.name ?? componentId}</strong><small>Essência incorporada</small></span>
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
          {item.grade === 1 && (
            <ArcanePanel title="Rito do Grau II" eyebrow="PRIMEIRA INFUSÃO" className="rite-readiness-panel">
              <div className="rite-requirements">
                <div className={resonanceReady ? 'met' : 'unmet'}>
                  {resonanceReady ? <Check size={16} /> : <LockKeyhole size={16} />}
                  <span>Ressonância mínima<strong>{item.resonance}/{item.resonanceThreshold}</strong></span>
                </div>
                <div className={inTerran ? 'met' : 'unmet'}>
                  {inTerran ? <Check size={16} /> : <MapPin size={16} />}
                  <span>Retorno ao hub<strong>Terran</strong></span>
                </div>
                <div className={fragment ? 'met' : 'unmet'}>
                  {fragment ? <Check size={16} /> : <LockKeyhole size={16} />}
                  <span>Componente infusível<strong>{fragmentDefinition?.name ?? 'Fragmento pendente'}</strong></span>
                </div>
              </div>
              <p className="modal-warning">O NPC e o local definitivo do rito permanecem OWNER_DECISION. Neste build, Terran executa o serviço técnico sem definir lore nova.</p>
            </ArcanePanel>
          )}
        </div>
      </div>

      <Modal
        open={riteOpen}
        onClose={() => setRiteOpen(false)}
        eyebrow="RITO DE EVOLUÇÃO"
        title="Infundir o primeiro Fragmento"
        footer={
          <>
            <GameButton variant="ghost" onClick={() => setRiteOpen(false)}>Cancelar</GameButton>
            <GameButton variant="primary" onClick={confirmGradeTwo} disabled={!gradeTwoReady}>
              <Sparkles size={16} /> Confirmar Infusão
            </GameButton>
          </>
        }
      >
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
        <p className="modal-warning">A remoção ou substituição de componentes permanece OWNER_DECISION. A Infusão é tratada como permanente neste marco.</p>
      </Modal>
    </GameShell>
  )
}
