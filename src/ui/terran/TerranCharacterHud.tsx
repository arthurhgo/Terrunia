import { Backpack, ChevronDown, Coins, Shield, Sparkles, Swords } from 'lucide-react'
import { useState } from 'react'
import { content } from '../../content/catalog'
import { deriveCharacterStats } from '../../domain/character/derivedStats'
import type { GameSave } from '../../domain/game/types'
import { EquippedCharacter } from '../characters/EquippedCharacter'
import { ProgressBar } from '../components/ProgressBar'
import { getBackpackCapacity } from '../../domain/inventory/backpacks'
import { AttributeAllocator } from '../character/AttributeAllocator'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { EquipmentGrid } from './EquipmentGrid'

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

/** Fixed, read-only classic RPG HUD. All numerical values come from the actual save. */
export function TerranCharacterHud({ save, backpackOpen = false, onToggleBackpack }: { save: GameSave; backpackOpen?: boolean; onToggleBackpack?: () => void }) {
  const { character, essence } = save
  const [view, setView] = useState<'status' | 'equipment' | 'attributes'>('status')
  const derived = deriveCharacterStats(save, content)
  return <aside className="terran-character-hud" aria-label="Status permanente do personagem">
    <header className="terran-character-hud__header">
      <span className="eyebrow">NEXO DO PERSONAGEM</span>
      <h2>PERSONAGEM</h2>
      <div className="terran-character-hud__identity">
        <div className="terran-character-hud__portrait-column">
          <div className="terran-character-hud__portrait">
            <EquippedCharacter save={save} facing="up" sheathed alt={'Arma guardada nas costas de ' + character.name} />
            <span>LV {character.level}</span>
          </div>
          <div className="terran-character-hud__view-switches" role="group" aria-label="Painel do personagem">
            <button type="button" className="terran-character-hud__view-button"
              aria-pressed={view === 'equipment'} aria-label={view === 'equipment' ? 'Mostrar Status' : 'Mostrar Equipamentos'}
              onClick={() => setView((current) => current === 'equipment' ? 'status' : 'equipment')}>
              {view === 'equipment' ? 'Status' : 'Equipamentos'}
            </button>
            <button type="button" className="terran-character-hud__view-button"
              aria-pressed={view === 'attributes'} aria-label={view === 'attributes' ? 'Mostrar Status' : 'Mostrar Atributos'}
              onClick={() => setView((current) => current === 'attributes' ? 'status' : 'attributes')}>
              {view === 'attributes' ? 'Status' : 'Atributos'}
              {character.unspentAttributePoints > 0 && <span className="terran-character-hud__point-badge" aria-label={character.unspentAttributePoints + ' pontos disponíveis'}>{character.unspentAttributePoints}</span>}
            </button>
          </div>
        </div>
        <div className="terran-character-hud__identity-main">
          <div className="terran-character-hud__identity-meta">
            <strong>{character.name}</strong>
            <small>{character.clan.clanId ? content.clans[character.clan.clanId]?.name ?? 'Clã' : 'Sem Clã'} · {character.classProgression.classId ? content.classes[character.classProgression.classId]?.name ?? 'Classe' : 'Sem Classe'}</small>
          </div>
          {view === 'equipment' ? <EquipmentGrid save={save} /> : view === 'attributes' ? <section className="terran-character-hud__details terran-character-hud__attribute-view" aria-label="Atributos e distribuição de pontos">
      <div className="terran-character-hud__attributes">
        {Object.entries(character.attributes).map(([key, value]) => {
          const id = key as keyof typeof attributeLabels
          return <div key={id} title={attributeFullNames[id]}>
            <span>{attributeLabels[id]}</span>
            <strong>d{value.die}{value.bonus > 0 ? `+${value.bonus}` : value.bonus < 0 ? value.bonus : ''}</strong>
          </div>
        })}
      </div>
      {character.unspentAttributePoints > 0 && <AttributeAllocator save={save} compact layout="vertical" />}
      <div className="terran-character-hud__combat">
        <span><Swords size={13} aria-hidden="true" /> Ataque <strong>{derived.primaryAttack.value}</strong></span>
        <span><Shield size={13} aria-hidden="true" /> Defesa <strong>{derived.defense.value}</strong></span>
      </div>
          </section> : <section className="terran-character-hud__resource-bars" aria-label="Recursos atuais">
            <ProgressBar label="Vida" value={save.vitals.hp} max={derived.life.value} tone="health" compact inside />
            <ProgressBar label="Mana" value={save.vitals.mp} max={derived.mana.value} compact inside />
            <ProgressBar label="Essência" value={essence.current} max={essence.required} tone="essence" compact inside />
            <ProgressBar label="XP" value={character.xp} max={character.xpRequired} compact inside />
          </section>
}
        </div>
      </div>
      {view === 'status' && <div className="terran-character-hud__resource-meta">
        <span><Coins size={12} aria-hidden="true" /> {save.wallet.gold.toLocaleString('pt-BR')} Ouro</span>
        <span><Sparkles size={12} aria-hidden="true" /> {essence.essencePoints} ponto(s) de Essência</span>
      </div>}
    </header>

    <section className="terran-character-hud__section terran-character-hud__backpack" aria-label="Mochila do personagem" id="terran-backpack-panel">
      <button type="button" className="terran-character-hud__section-heading terran-character-hud__toggle" aria-expanded={backpackOpen}
        onClick={onToggleBackpack}><Backpack size={15} /> MOCHILA <span>{save.inventory.length}/{getBackpackCapacity(save)}</span>
        <ChevronDown size={16} className={backpackOpen ? 'is-expanded' : ''} /></button>
      {backpackOpen && <InventoryPanel save={save} compact />}
    </section>
  </aside>
}
