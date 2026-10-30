import { Minus, Plus } from 'lucide-react'
import { BALANCE } from '../../content/balance'
import { ATTRIBUTE_IDS, type AttributeId, type GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { DieIcon } from '../components/DieIcon'

const labels: Record<AttributeId, { name: string; role: string; combat: string }> = {
  cunning: { name: 'Astúcia', role: 'focos e grimórios', combat: 'Escala armas de Astúcia. Sem foco equipado, contribui para a leitura de ataque mágico.' },
  agility: { name: 'Agilidade', role: 'arcos, adagas e iniciativa', combat: 'Contribui diretamente para a iniciativa; também escala arcos e adagas.' },
  strength: { name: 'Força', role: 'lâminas e armas pesadas', combat: 'Contribui para o ataque físico e para o dano base de armas que escalam Força.' },
  vigor: { name: 'Vigor', role: 'vida, armaduras e proteção', combat: 'Aumenta Vida e Defesa, reduzindo dano recebido pelas regras atuais.' },
  spirit: { name: 'Espírito', role: 'mana, cajados e focos', combat: 'Aumenta a reserva de Mana e escala armas vinculadas ao Espírito.' },
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
                <span className="attribute-stepper__die"><DieIcon sides={attribute.die} /> <b>d{attribute.die}{attribute.bonus ? ` +${attribute.bonus}` : ''}</b></span>
                <button type="button" aria-label={`Aumentar ${labels[id].name}`} disabled={!canIncrease} onClick={() => adjust(id, 1)}><Plus size={14} /></button>
              </div>
              <p className="attribute-allocator__combat" title={labels[id].combat}>{labels[id].combat}</p>
            </article>
          )
        })}
      </div>
      <p>{locked ? 'A distribuição não pode ser reduzida após o primeiro Vínculo. Novos pontos ainda podem ser investidos.' : 'Antes do Vínculo, pontos podem ser redistribuídos livremente.'}</p>
    </section>
  )
}
