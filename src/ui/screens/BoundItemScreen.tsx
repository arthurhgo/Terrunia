import { Gem, LockKeyhole, Sparkles } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { content } from '../../content/catalog'
import { getBoundSlotCapacity } from '../../domain/bond/boundItems'
import { BOUND_SLOT_LABELS, BOUND_SLOTS, type BoundSlot } from '../../domain/shared/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'
import { ProgressBar } from '../components/ProgressBar'

export function BoundItemScreen() {
  const { slot } = useParams()
  const save = useGameStore((state) => state.save)
  if (!save || !BOUND_SLOTS.includes(slot as BoundSlot)) return <Navigate to="/terran" replace />
  const boundSlot = slot as BoundSlot
  const itemId = save.character.bondedEquipment[boundSlot]
  const item = itemId ? save.boundItems[itemId] : null
  if (!item) return <Navigate to="/terran" replace />
  const definition = content.boundItemBases[item.baseItemId]
  const capacity = getBoundSlotCapacity(item.grade)

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
              <button type="button" className="game-button game-button--ghost" disabled><LockKeyhole size={17} /> Rito G2 bloqueado</button>
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
          </ArcanePanel>
          <ArcanePanel title="Memórias" eyebrow="HISTÓRIA DO VÍNCULO">
            <div className="memory-list">
              {item.memories.map((memory) => (
                <article key={memory.id}><Sparkles size={17} /><div><strong>{memory.title}</strong><p>{memory.description}</p></div></article>
              ))}
            </div>
          </ArcanePanel>
        </div>
      </div>
    </GameShell>
  )
}
