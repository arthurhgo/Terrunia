import { Check, LockKeyhole, Shield, Sparkles, Swords } from 'lucide-react'
import { useState } from 'react'
import { content } from '../../content/catalog'
import { deriveWeaponPreview, evaluateEquipmentRequirements } from '../../domain/bond/equipmentLoadout'
import type { GameSave } from '../../domain/game/types'
import { AssetImage } from '../components/AssetImage'
import { DieIcon } from '../components/DieIcon'

type Props = {
  save: GameSave
  selectedId: string
  onSelect: (id: string) => void
}

const attributeNames = {
  strength: 'Força', agility: 'Agilidade', cunning: 'Astúcia',
  vigor: 'Vigor', spirit: 'Espírito',
}

/** All skills and clan bonuses here are read from the game catalog, never fabricated. */
export function WeaponGallery({ save, selectedId, onSelect }: Props) {
  const weapons = Object.values(content.boundItemBases)
    .filter((definition) => definition.slot === 'weapon' && definition.id !== 'bound_weapon_prologue_base')
  const [inspectedId, setInspectedId] = useState<string | null>(null)
  const inspected = weapons.find((weapon) => weapon.id === inspectedId)
    ?? weapons.find((weapon) => weapon.id === selectedId) ?? weapons[0]
  const preview = deriveWeaponPreview(save, content, inspected)
  const clans = Object.values(content.clans).map((clan) => ({
    ...clan,
    combatBonus: inspected.powerType === 'magical'
      ? clan.bonuses.magicalAttack ?? 0
      : clan.bonuses.physicalAttack ?? 0,
    classes: clan.classIds.map((id) => content.classes[id]).filter(Boolean),
  })).sort((a, b) => b.combatBonus - a.combatBonus)
  const strongestBonus = Math.max(...clans.map((clan) => clan.combatBonus), 0)
  const die = save.character.attributes[inspected.scalingAttribute].die

  return <section className="weapon-gallery" aria-label="Galeria flutuante de armas vinculadas">
    <header className="weapon-gallery__heading">
      <p className="eyebrow">ARSENAL DO PRIMEIRO VÍNCULO</p>
      <h2>Escolha sua fundação</h2>
      <p>Selecione com um clique. Passe o mouse ou use Tab para inspecionar habilidades, atributos e caminhos de Clã.</p>
    </header>
    <div className="weapon-gallery__grid" aria-label="Armas iniciais">
      {weapons.map((weapon, i) => {
        const requirements = evaluateEquipmentRequirements(save.character, weapon)
        return <button type="button" key={weapon.id}
          className={`weapon-gallery__choice ${selectedId === weapon.id ? 'is-selected' : ''} ${requirements.eligible ? '' : 'is-locked'}`}
          aria-label={`Escolher ${weapon.name}`}
          aria-pressed={selectedId === weapon.id}
          onMouseEnter={() => setInspectedId(weapon.id)}
          onFocus={() => setInspectedId(weapon.id)}
          onClick={() => { onSelect(weapon.id); setInspectedId(weapon.id) }}
          style={{ animationDelay: `${i * -0.36}s` }}>
          <span className="weapon-gallery__aura" aria-hidden="true" />
          <AssetImage className="weapon-gallery__sprite" assetId={weapon.assetIdByGrade[1] ?? ''} alt="" />
          <strong>{weapon.name}</strong>
          <small>{weapon.archetype}</small>
          <span className="weapon-gallery__check">{requirements.eligible ? <Check size={13} /> : <LockKeyhole size={13} />}</span>
        </button>
      })}
    </div>
    <article className="weapon-gallery__inspection" aria-live="polite">
      <div className="weapon-gallery__identity">
        <div className="weapon-gallery__artifact"><AssetImage assetId={inspected.assetIdByGrade[1] ?? ''} alt="" /></div>
        <div>
          <span className="eyebrow">ARMA EM FOCO</span>
          <h3>{inspected.name}</h3>
          <p>{inspected.description}</p>
          <span className="weapon-gallery__attack"><Swords size={14} /> Ataque projetado: {preview.totalAttack}</span>
          <span className="weapon-gallery__scale"><DieIcon sides={die} /> Escala: {attributeNames[inspected.scalingAttribute]} · d{die}</span>
        </div>
      </div>
      <div className="weapon-gallery__skills">
        <h4><Sparkles size={15} /> Habilidades do Vínculo</h4>
        {preview.skills.map((skill) =>
          <div key={skill.skillId}>
            <strong>{skill.definition?.name ?? 'Habilidade não cadastrada'}</strong>
            <small>Grau {skill.grade} · {skill.definition?.mpCost ?? 0} MP</small>
            <p>{skill.definition?.description ?? 'Aguardando definição.'}</p>
          </div>)}
      </div>
      <div className="weapon-gallery__clans">
        <h4><Shield size={15} /> Sinergias e caminhos de Clã</h4>
        <p className="weapon-gallery__notice">Bônus condicionais à filiação. Não são concedidos no primeiro Vínculo; as disciplinas abaixo são caminhos futuros, não skills desbloqueadas.</p>
        {clans.map((clan) =>
          <div className={`weapon-gallery__clan ${clan.combatBonus === strongestBonus && strongestBonus > 0 ? 'is-affine' : ''}`} key={clan.id}>
            <div><strong>{clan.name}</strong><small>{clan.bonusLabel}</small></div>
            <span>{clan.combatBonus > 0 ? `+${clan.combatBonus} ataque ${inspected.powerType === 'magical' ? 'mágico' : 'físico'}` : 'Sem bônus direto de ataque'}</span>
            <small>{clan.classes.map((classe) => `${classe.name}: ${classe.role}`).join(' · ')}</small>
          </div>)}
      </div>
    </article>
  </section>
}
