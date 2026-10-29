import { Check, LockKeyhole, Sparkles, Swords } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { deriveWeaponPreview, evaluateEquipmentRequirements } from '../../domain/bond/equipmentLoadout'
import { BOUND_SLOT_LABELS, BOUND_SLOTS } from '../../domain/shared/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'
import { AttributeAllocator } from '../character/AttributeAllocator'

const damageLabels = { cutting: 'Corte', piercing: 'Perfuração', blunt: 'Impacto', arcane: 'Arcano', protection: 'Proteção', resonance: 'Ressonância' }
const weightLabels = { light: 'Leve', medium: 'Médio', heavy: 'Pesado' }
const rankLabels = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const

export function ArsenalScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />
  const definitions = Object.values(content.boundItemBases).filter((entry) => entry.id !== 'bound_weapon_prologue_base')

  return (
    <GameShell fluid>
      <div className="arsenal-screen">
        <header className="screen-heading arsenal-heading"><p className="eyebrow">ARSENAL DO NEXO · DATA-DRIVEN</p><h1>Fundações de Vínculo</h1><p>Todo Terrírian pode usar qualquer arquétipo. Os limites vêm de nível e atributos; Clã e Classe apenas especializam a escolha.</p></header>
        <AttributeAllocator save={save} compact />
        {BOUND_SLOTS.map((slot) => {
          const entries = definitions.filter((entry) => entry.slot === slot)
          const activeId = save.character.bondedEquipment[slot]
          return (
            <ArcanePanel key={slot} title={BOUND_SLOT_LABELS[slot]} eyebrow={`${entries.length} FUNDAÇÕES · RANKS DEFINIDOS`} className="arsenal-section">
              <div className="arsenal-grid">
                {entries.map((definition) => {
                  const eligibility = evaluateEquipmentRequirements(save.character, definition)
                  const active = activeId ? save.boundItems[activeId]?.baseItemId === definition.id : false
                  const preview = slot === 'weapon' ? deriveWeaponPreview(save, content, definition) : null
                  return (
                    <article key={definition.id} className={`arsenal-card ${eligibility.eligible ? 'is-eligible' : 'is-locked'} ${active ? 'is-active' : ''}`}>
                      <div className="arsenal-card__visual"><AssetImage assetId={definition.assetIdByGrade[1] ?? ''} /><span>RANK {rankLabels[definition.rank - 1]}</span></div>
                      <div className="arsenal-card__body">
                        <header><div><small>{definition.archetype}</small><h3>{definition.name}</h3></div>{active ? <span className="arsenal-active"><Check size={14} /> Vinculada</span> : null}</header>
                        <p>{definition.description}</p>
                        <div className="arsenal-card__metrics"><span>{damageLabels[definition.damageType]}</span><span>{weightLabels[definition.weightClass]}</span><span>Poder {definition.basePower}</span>{preview ? <strong><Swords size={14} /> Total {preview.totalAttack}</strong> : null}</div>
                        <div className="arsenal-requirements">{eligibility.requirements.map((requirement) => <span key={requirement.id} className={requirement.met ? 'met' : 'unmet'}>{requirement.met ? <Check size={12} /> : <LockKeyhole size={12} />}{requirement.label}</span>)}</div>
                        {preview?.skills.map((skill) => <div className="arsenal-skill" key={skill.skillId}><Sparkles size={15} /><span><strong>{skill.definition?.name}</strong><small>G{skill.grade} · {skill.definition?.mpCost} MP · poder projetado {skill.projectedPower}</small></span></div>)}
                        {active ? <Link to={`/bound-items/${slot}`} className="panel-link">Abrir Vínculo</Link> : <small className="arsenal-availability">{slot === 'weapon' && !save.character.bondedEquipment.weapon ? 'Selecionável no primeiro Vínculo' : 'Fundação disponível em rito futuro'}</small>}
                      </div>
                    </article>
                  )
                })}
              </div>
            </ArcanePanel>
          )
        })}
      </div>
    </GameShell>
  )
}
