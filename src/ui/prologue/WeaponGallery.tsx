import { Check, LockKeyhole, Shield, Sparkles, Swords } from 'lucide-react'
import { useState } from 'react'
import { content } from '../../content/catalog'
import { deriveWeaponPreview, evaluateEquipmentRequirements } from '../../domain/bond/equipmentLoadout'
import type { GameSave } from '../../domain/game/types'
import { AssetImage } from '../components/AssetImage'
import { DieIcon } from '../components/DieIcon'

type Props = {
  save: GameSave
  selectedId: string | null
  onSelect: (id: string) => void
}

const attributeNames = {
  strength: 'Força', agility: 'Agilidade', cunning: 'Astúcia',
  vigor: 'Vigor', spirit: 'Espírito',
}

/** A single compact arsenal. Hover previews; click commits the selection and unlocks clan comparisons. */
export function WeaponGallery({ save, selectedId, onSelect }: Props) {
  const weapons = Object.values(content.boundItemBases)
    .filter((definition) => definition.slot === 'weapon' && definition.id !== 'bound_weapon_prologue_base')
  const [inspectedId, setInspectedId] = useState<string | null>(null)
  const selectedWeapon = selectedId ? weapons.find((weapon) => weapon.id === selectedId) : undefined
  const inspected = weapons.find((weapon) => weapon.id === inspectedId) ?? selectedWeapon
  const preview = inspected ? deriveWeaponPreview(save, content, inspected) : null
  const clans = selectedWeapon ? Object.values(content.clans).map((clan) => ({
    id: clan.id,
    name: clan.name,
    combatBonus: selectedWeapon.powerType === 'magical'
      ? clan.bonuses.magicalAttack ?? 0
      : clan.bonuses.physicalAttack ?? 0,
    // Only save-backed, numeric clan bonuses; no future class paths or hypothetical synergies.
    bonuses: [
      { label: 'Vida', value: clan.bonuses.maxHp ?? 0 },
      { label: 'Defesa', value: clan.bonuses.mitigation ?? 0 },
      { label: 'Mana', value: clan.bonuses.mana ?? 0 },
      { label: 'Ataque físico', value: clan.bonuses.physicalAttack ?? 0 },
      { label: 'Ataque mágico', value: clan.bonuses.magicalAttack ?? 0 },
    ].filter((bonus) => bonus.value > 0),
  })).sort((a, b) => b.combatBonus - a.combatBonus) : []
  const strongestBonus = Math.max(0, ...clans.map((clan) => clan.combatBonus))

  return <section className="weapon-gallery" aria-label="Galeria flutuante de armas vinculadas">
    <header className="weapon-gallery__heading">
      <span className="eyebrow">ARSENAL DO PRIMEIRO VÍNCULO</span>
    </header>
    <div className="weapon-gallery__grid" aria-label="Armas iniciais">
      {weapons.map((weapon, i) => {
        const requirements = evaluateEquipmentRequirements(save.character, weapon)
        return <button type="button" key={weapon.id}
          className={`weapon-gallery__choice ${selectedId === weapon.id ? 'is-selected' : ''} ${requirements.eligible ? '' : 'is-locked'}`}
          aria-label={`Escolher ${weapon.name}`}
          aria-pressed={selectedId === weapon.id}
          onMouseEnter={() => setInspectedId(weapon.id)}
          onMouseLeave={() => setInspectedId(null)}
          onFocus={() => setInspectedId(weapon.id)}
          onBlur={() => setInspectedId(null)}
          onClick={() => { onSelect(weapon.id); setInspectedId(weapon.id) }}
          style={{ animationDelay: `${i * -0.36}s` }}>
          <span className="weapon-gallery__aura" aria-hidden="true" />
          <AssetImage className="weapon-gallery__sprite" assetId={weapon.assetIdByGrade[1] ?? ''} alt="" />
          <strong>{weapon.name}</strong>
          <span className="weapon-gallery__check">{requirements.eligible ? <Check size={12} /> : <LockKeyhole size={12} />}</span>
        </button>
      })}
    </div>
    <div className="weapon-gallery__inspection" aria-live="polite">
      {inspected && preview ? <>
        <div className="weapon-gallery__identity">
          <AssetImage assetId={inspected.assetIdByGrade[1] ?? ''} alt="" />
          <div>
            <strong>{inspected.name}</strong>
            <small>{inspected.description}</small>
          </div>
          <span className="weapon-gallery__attack"><Swords size={13} /> {preview.totalAttack}</span>
          <span className="weapon-gallery__scale">
            <DieIcon sides={save.character.attributes[inspected.scalingAttribute].die} />
            {attributeNames[inspected.scalingAttribute]}
          </span>
        </div>
        <div className="weapon-gallery__skills">
          <strong><Sparkles size={13} /> Skills</strong>
          {preview.skills.map((skill) =>
            <span key={skill.skillId} title={skill.definition?.description ?? 'Habilidade em definição.'}>
              {skill.definition?.name ?? 'Habilidade não cadastrada'} <small>G{skill.grade} · {skill.definition?.mpCost ?? 0} MP</small>
            </span>)}
        </div>
      </> : <p className="weapon-gallery__hint">Sem arma vinculada — escolha uma das sete armas para ver suas habilidades.</p>}
    </div>
    {selectedWeapon && <div className="weapon-gallery__clans" aria-label={`Sinergias de Clã para ${selectedWeapon.name}`}>
      <h4><Shield size={14} /> Sinergias e caminhos de Clã</h4>
      <div className="weapon-gallery__clan-grid">
        {clans.map((clan) => <div className={`weapon-gallery__clan ${clan.combatBonus === strongestBonus && strongestBonus > 0 ? 'is-affine' : ''}`}
          key={clan.id}>
          <strong>{clan.name}</strong>
          <div className="weapon-gallery__bonus-list">
            {clan.bonuses.map((bonus) =>
              <span key={bonus.label}>+${bonus.value} ${bonus.label}</span>)}
          </div>
        </div>)}
      </div>
    </div>}
  </section>
}
