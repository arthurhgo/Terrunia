import { Check, LockKeyhole, Swords, Waypoints } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { deriveWeaponPreview, evaluateEquipmentRequirements } from '../../domain/bond/equipmentLoadout'
import { useGameStore } from '../../state/gameStore'
import { AttributeAllocator } from '../character/AttributeAllocator'
import { BoundWeaponCharacterPreview } from '../prologue/BoundWeaponCharacterPreview'
import { WeaponGallery } from '../prologue/WeaponGallery'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameButton } from '../components/GameButton'
import './prologueEnhanced.css'

export function PrologueScreen() {
  const save = useGameStore((state) => state.save)
  const bindWeapon = useGameStore((state) => state.bindPrologueWeapon)
  const navigate = useNavigate()
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null)

  if (!save) return <Navigate to="/character/create" replace />
  if (save.character.bondedEquipment.weapon) return <Navigate to="/terran" replace />

  const selectedWeapon = selectedWeaponId ? content.boundItemBases[selectedWeaponId] : undefined
  const eligibility = selectedWeapon ? evaluateEquipmentRequirements(save.character, selectedWeapon) : null
  const preview = selectedWeapon ? deriveWeaponPreview(save, content, selectedWeapon) : null

  const complete = () => {
    if (!selectedWeapon || !eligibility?.eligible) return
    if (bindWeapon(selectedWeapon.id)) navigate('/terran')
  }

  return <main className="prologue-screen prologue-screen--enhanced">
    <div className="prologue-screen__rune" aria-hidden="true" />
    <section className="prologue-copy">
      <p className="eyebrow">PRÓLOGO · TERRÚNIA</p>
      <h1>O primeiro Vínculo</h1>
      <p>Escolha sua arma permanente e distribua os atributos do Terrírian.</p>
      <AttributeAllocator save={save} compact />
    </section>

    <ArcanePanel title="Escolha da Arma Vinculada"
      subtitle="Sete arquétipos · escolha uma arma para iniciar"
      className="prologue-bindings prologue-arsenal">
      <WeaponGallery save={save} selectedId={selectedWeaponId} onSelect={setSelectedWeaponId} />
      <div className="prologue-choice-summary">
        <BoundWeaponCharacterPreview save={save}
          weapon={selectedWeapon ? { name: selectedWeapon.name, assetId: selectedWeapon.assetIdByGrade[1] ?? '' } : null} />
        <div className="prologue-choice-detail">
          {selectedWeapon && preview && eligibility ? <>
            <span className="eyebrow">FUNDAÇÃO SELECIONADA</span>
            <h3>{selectedWeapon.name}</h3>
            <p><Swords size={14} aria-hidden="true" /> {selectedWeapon.powerType === 'magical' ? 'Ataque mágico' : 'Ataque físico'}: {preview.totalAttack} · Grau I</p>
            <div className="arsenal-requirements" aria-label="Requisitos da arma selecionada">
              {eligibility.requirements.map((requirement) =>
                <span key={requirement.id} className={requirement.met ? 'met' : 'unmet'}>
                  {requirement.met ? <Check size={12} /> : <LockKeyhole size={12} />}{requirement.label}
                </span>)}
            </div>
          </> : <>
            <span className="eyebrow">FUNDAÇÃO INICIAL</span>
            <h3>Sem arma vinculada</h3>
            <p>Selecione uma arma no arsenal. A prévia aparece na mão do personagem.</p>
          </>}
        </div>
      </div>
      <GameButton variant="primary" full onClick={complete} disabled={!selectedWeapon || !eligibility?.eligible}>
        {selectedWeapon && eligibility?.eligible ? <Waypoints size={18} /> : <LockKeyhole size={18} />}
        {!selectedWeapon ? 'Selecione uma arma' : eligibility?.eligible
          ? `Vincular ${selectedWeapon.name} — Grau I`
          : 'Atributos insuficientes para o Vínculo'}
      </GameButton>
    </ArcanePanel>
  </main>
}
