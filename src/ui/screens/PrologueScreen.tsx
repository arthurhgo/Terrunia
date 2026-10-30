import { Check, Link2, LockKeyhole, Sparkles, Swords, Waypoints } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { deriveWeaponPreview, evaluateEquipmentRequirements } from '../../domain/bond/equipmentLoadout'
import { useGameStore } from '../../state/gameStore'
import { AttributeAllocator } from '../character/AttributeAllocator'
import { WeaponGallery } from '../prologue/WeaponGallery'
import './prologueEnhanced.css'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'

export function PrologueScreen() {
  const save = useGameStore((state) => state.save)
  const bindWeapon = useGameStore((state) => state.bindPrologueWeapon)
  const navigate = useNavigate()
  const weapons = Object.values(content.boundItemBases).filter((definition) => definition.slot === 'weapon' && definition.id !== 'bound_weapon_prologue_base')
  const [selectedWeaponId, setSelectedWeaponId] = useState('bound_weapon_long_sword')

  if (!save) return <Navigate to="/character/create" replace />
  if (save.character.bondedEquipment.weapon) return <Navigate to="/terran" replace />

  const selectedWeapon = content.boundItemBases[selectedWeaponId] ?? weapons[0]
  const eligibility = evaluateEquipmentRequirements(save.character, selectedWeapon)
  const preview = deriveWeaponPreview(save, content, selectedWeapon)

  const complete = () => {
    if (!eligibility.eligible) return
    if (bindWeapon(selectedWeapon.id)) navigate('/terran')
  }

  return (
    <main className="prologue-screen prologue-screen--enhanced">
      <div className="prologue-screen__rune" aria-hidden="true" />
      <section className="prologue-copy">
        <p className="eyebrow">PRÓLOGO TÉCNICO · CONTEÚDO DE DESENVOLVIMENTO</p>
        <h1>O primeiro Vínculo</h1>
        <p>
          Antes de cruzar Terran, seu Terrírian precisa reconhecer uma peça-base. A origem narrativa definitiva dos cinco equipamentos permanece em <code>OWNER_DECISION</code>.
        </p>
        <div className="prologue-rule">
          <Link2 size={22} />
          <span><strong>Vínculo é permanente.</strong> Drops futuros alimentam sua evolução; não substituem esta peça.</span>
        </div>
        <WeaponGallery save={save} selectedId={selectedWeapon.id} onSelect={setSelectedWeaponId} />
      </section>

      <ArcanePanel title="Escolha da Arma Vinculada" subtitle="Qualquer arquétipo · requisitos do personagem" className="prologue-bindings prologue-arsenal">
        <AttributeAllocator save={save} />
        <div className="prologue-weapon-preview">
          <div className="prologue-weapon-preview__visual"><AssetImage assetId={selectedWeapon.assetIdByGrade[1] ?? ''} /><span>RANK I · GRAU I</span></div>
          <div>
            <p className="eyebrow">FUNDAÇÃO SELECIONADA</p><h3>{selectedWeapon.name}</h3><p>{selectedWeapon.description}</p>
            <div className="arsenal-card__metrics"><span>{selectedWeapon.powerType === 'magical' ? 'Ataque mágico' : 'Ataque físico'}</span><span>{selectedWeapon.weightClass}</span><strong><Swords size={14} /> Total {preview.totalAttack}</strong></div>
            <div className="arsenal-requirements">{eligibility.requirements.map((requirement) => <span key={requirement.id} className={requirement.met ? 'met' : 'unmet'}>{requirement.met ? <Check size={12} /> : <LockKeyhole size={12} />}{requirement.label}</span>)}</div>
            {preview.skills.map((skill) => <div className="arsenal-skill" key={skill.skillId}><Sparkles size={15} /><span><strong>{skill.definition?.name}</strong><small>{skill.definition?.mpCost} MP · poder projetado {skill.projectedPower}</small></span></div>)}
          </div>
        </div>
        <GameButton variant="primary" full onClick={complete} disabled={!eligibility.eligible}>
          {eligibility.eligible ? <Waypoints size={18} /> : <LockKeyhole size={18} />} {eligibility.eligible ? `Vincular ${selectedWeapon.name} — Grau I` : 'Distribua atributos para cumprir os requisitos'}
        </GameButton>
      </ArcanePanel>
    </main>
  )
}
