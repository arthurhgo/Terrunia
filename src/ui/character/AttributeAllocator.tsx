import { Minus, Plus } from 'lucide-react'
import { BALANCE } from '../../content/balance'
import { ATTRIBUTE_IDS, type AttributeId, type GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'

const labels: Record<AttributeId, { name: string; role: string }> = {
  cunning: { name: 'Astúcia', role: 'magia, análise e grimórios' },
  agility: { name: 'Agilidade', role: 'arcos, adagas e iniciativa' },
  strength: { name: 'Força', role: 'lâminas e armas pesadas' },
  vigor: { name: 'Vigor', role: 'vida, armaduras e proteção' },
  spirit: { name: 'Espírito', role: 'mana, cajados e focos' },
}

export function AttributeAllocator({ save, compact = false }: { save: GameSave; compact?: boolean }) {
  const adjust = useGameStore((state) => state.adjustAttribute)
  const locked = Boolean(save.character.bondedEquipment.weapon)

  return (
    <section className={`attribute-allocator ${compact ? 'attribute-allocator--compact' : ''}`} aria-label="Distribuição de atributos">
      <header>
        <div><span className="eyebrow">LIMITES DO TERRÍRIAN</span><strong>Distribuição de atributos</strong></div>
        <span className="attribute-point-pool"><b>{save.character.unspentAttributePoints}</b> ponto(s)</span>
      </header>
      <div className="attribute-allocator__grid">
        {ATTRIBUTE_IDS.map((id) => {
          const attribute = save.character.attributes[id]
          const canIncrease = save.character.unspentAttributePoints > 0 && attribute.die < 12
          const canRefund = !locked && attribute.die > BALANCE.defaultAttributeDie
          return (
            <article key={id}>
              <div><strong>{labels[id].name}</strong><small>{labels[id].role}</small></div>
              <div className="attribute-stepper">
                <button type="button" aria-label={`Reduzir ${labels[id].name}`} disabled={!canRefund} onClick={() => adjust(id, -1)}><Minus size={14} /></button>
                <span>d{attribute.die}{attribute.bonus ? ` +${attribute.bonus}` : ''}</span>
                <button type="button" aria-label={`Aumentar ${labels[id].name}`} disabled={!canIncrease} onClick={() => adjust(id, 1)}><Plus size={14} /></button>
              </div>
            </article>
          )
        })}
      </div>
      <p>{locked ? 'A distribuição não pode ser reduzida após o primeiro Vínculo. Novos pontos ainda podem ser investidos.' : 'Antes do Vínculo, pontos podem ser redistribuídos livremente.'}</p>
    </section>
  )
}
