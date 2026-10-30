import { ChevronDown, Coins, Gem, Shield, Shirt, Sparkles, Sword, Swords, Watch } from 'lucide-react'
import { useState } from 'react'
import { content } from '../../content/catalog'
import { deriveCharacterStats } from '../../domain/character/derivedStats'
import { BOUND_SLOTS, BOUND_SLOT_LABELS } from '../../domain/shared/types'
import type { GameSave } from '../../domain/game/types'
import { AssetImage } from '../components/AssetImage'
import { ProgressBar } from '../components/ProgressBar'

const attributeLabels = {
  cunning: 'AST',
  agility: 'AGI',
  strength: 'FOR',
  vigor: 'VIG',
  spirit: 'ESP',
} as const

const attributeFullNames = {
  cunning: 'Astúcia',
  agility: 'Agilidade',
  strength: 'Força',
  vigor: 'Vigor',
  spirit: 'Espírito',
} as const

const emptySlotIcons = { weapon: Sword, shield: Shield, armor: Shirt, necklace: Gem, bracelet: Watch } as const

/** Fixed, read-only classic RPG HUD. All numerical values come from the actual save. */
export function TerranCharacterHud({ save }: { save: GameSave }) {
  const { character, essence } = save
  const [attributesExpanded, setAttributesExpanded] = useState(true)
  const derived = deriveCharacterStats(save, content)
  return <aside className="terran-character-hud" aria-label="Status permanente do personagem">
    <header className="terran-character-hud__header">
      <span className="eyebrow">NEXO DO PERSONAGEM</span>
      <h2>PERSONAGEM</h2>
      <div className="terran-character-hud__identity">
        <div className="terran-character-hud__portrait">
          <AssetImage assetId={character.portraitAssetId} alt={`Retrato de ${character.name}`} />
          <span>LV {character.level}</span>
        </div>
        <div>
          <strong>{character.name}</strong>
          <small>{character.clan.clanId ? content.clans[character.clan.clanId]?.name ?? 'Clã' : 'Sem Clã'} · {character.classProgression.classId ? content.classes[character.classProgression.classId]?.name ?? 'Classe' : 'Sem Classe'}</small>
          <p><Coins size={13} aria-hidden="true" /> {save.wallet.gold.toLocaleString('pt-BR')} Ouro</p>
        </div>
      </div>
    </header>

    <section className="terran-character-hud__section" aria-label="Recursos atuais">
      <ProgressBar label="Vida" value={save.vitals.hp} max={derived.life.value} tone="health" compact />
      <ProgressBar label="Mana" value={save.vitals.mp} max={derived.mana.value} compact />
      <ProgressBar label="XP" value={character.xp} max={character.xpRequired} compact />
      <ProgressBar label="Essência" value={essence.current} max={essence.required} tone="essence" compact />
      <p className="terran-character-hud__essence"><Sparkles size={13} aria-hidden="true" /> {essence.essencePoints} ponto(s) de Essência</p>
    </section>

    <section className="terran-character-hud__section" aria-label="Cinco equipamentos vinculados">
      <div className="terran-character-hud__section-heading"><Gem size={14} aria-hidden="true" /> VÍNCULOS <span>{BOUND_SLOTS.filter((slot) => character.bondedEquipment[slot]).length}/5</span></div>
      <div className="terran-character-hud__slots">
        {BOUND_SLOTS.map((slot) => {
          const id = character.bondedEquipment[slot]
          const instance = id ? save.boundItems[id] : null
          const definition = instance ? content.boundItemBases[instance.baseItemId] : null
          const EmptyIcon = emptySlotIcons[slot]
          return <div className={`terran-character-hud__slot ${instance ? 'is-bound' : 'is-empty'}`} key={slot}
            title={`${BOUND_SLOT_LABELS[slot]} · ${definition?.name ?? 'Não vinculado'}`}>
            <span>{BOUND_SLOT_LABELS[slot]}</span>
            <div className="terran-character-hud__slot-art">
              {instance && definition
                ? <AssetImage assetId={definition.assetIdByGrade[instance.grade] ?? definition.assetIdByGrade[1] ?? ''}
                    alt={definition.name} />
                : <span className="terran-character-hud__empty-icon" aria-hidden="true">
                    <EmptyIcon size={26} strokeWidth={1.7} />
                  </span>}
            </div>
            <small>{instance ? `G${instance.grade}` : 'Vazio'}</small>
          </div>
        })}
      </div>
    </section>

    <section className="terran-character-hud__section" aria-label="Atributos e combate">
      <button className="terran-character-hud__section-heading terran-character-hud__toggle" type="button"
        aria-expanded={attributesExpanded} aria-controls="terran-character-attributes"
        onClick={() => setAttributesExpanded((expanded) => !expanded)}>
        <Shield size={14} aria-hidden="true" /> ATRIBUTOS
        <ChevronDown size={16} aria-hidden="true" className={attributesExpanded ? 'is-expanded' : ''} />
      </button>
      {attributesExpanded && <div id="terran-character-attributes" className="terran-character-hud__details">
      <div className="terran-character-hud__attributes">
        {Object.entries(character.attributes).map(([key, value]) => {
          const id = key as keyof typeof attributeLabels
          return <div key={id} title={attributeFullNames[id]}>
            <span>{attributeLabels[id]}</span>
            <strong>d{value.die}{value.bonus > 0 ? `+${value.bonus}` : value.bonus < 0 ? value.bonus : ''}</strong>
          </div>
        })}
      </div>
      <div className="terran-character-hud__combat">
        <span><Swords size={13} aria-hidden="true" /> Ataque <strong>{derived.primaryAttack.value}</strong></span>
        <span><Shield size={13} aria-hidden="true" /> Defesa <strong>{derived.defense.value}</strong></span>
      </div>
      </div>}
    </section>
  </aside>
}
