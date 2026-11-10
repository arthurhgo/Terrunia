import { Footprints, Gem, HardHat, Package, Shield, Shirt, Sword, Watch } from 'lucide-react'
import type { ComponentType } from 'react'
import type { GameSave } from '../../domain/game/types'
import type { BoundSlot, ComplementarySlot } from '../../domain/shared/types'
import { gearOfferById, getGearGrade, gearSpriteId, formatGearStats } from '../../content/equipmentV0515'
import { content } from '../../content/catalog'
import { useGameStore } from '../../state/gameStore'
import { getEquippedBasicArmor } from '../../domain/inventory/basicArmor'
import { AssetImage } from '../components/AssetImage'
import './equipmentGrid.css'

type Slot = { id: string; label: string; bound?: BoundSlot; complementary?: ComplementarySlot; icon: ComponentType<{size?: number}> }
const slots: Slot[] = [
  { id: 'helmet', label: 'Capacete', complementary: 'helmet', icon: HardHat },
  { id: 'necklace', label: 'Colar', bound: 'necklace', icon: Gem },
  { id: 'accessoryA', label: 'Acessório I', complementary: 'accessoryA', icon: Package },
  { id: 'weapon', label: 'Arma', bound: 'weapon', icon: Sword },
  { id: 'armor', label: 'Túnica / Armadura', bound: 'armor', icon: Shirt },
  { id: 'shield', label: 'Escudo', bound: 'shield', icon: Shield },
  { id: 'pants', label: 'Calça', complementary: 'pants', icon: Shirt },
  { id: 'boots', label: 'Bota', complementary: 'boots', icon: Footprints },
  { id: 'accessoryB', label: 'Acessório II', complementary: 'accessoryB', icon: Package },
]

/** Slot labels and equipment state come from the actual save. Empty IDs use icons,
 * never asset-path-derived gameplay logic; linked slots remain permanent.
 */
export function EquipmentGrid({ save }: { save: GameSave }) {
  const equipArmor = useGameStore((state) => state.equipArmor)
  const equipComplementary = useGameStore((state) => state.equipComplementary)
  const equipGearStyle = useGameStore((state) => state.equipGearStyle)
  const basicArmor = getEquippedBasicArmor(save, content)
  const renderSlot = (slot: Slot) => {
    const boundId = slot.bound ? save.character.bondedEquipment[slot.bound] : null
    const boundInstance = boundId ? save.boundItems[boundId] : null
    const linked = boundInstance ? content.boundItemBases[boundInstance.baseItemId] : null
    const worn = slot.complementary ? save.equippedComplementary?.[slot.complementary] : null
    const ordinary = worn ? content.items[worn.definitionId] : null
    const starter = slot.bound === 'armor' && !linked ? basicArmor : null
    const shell = slot.bound ? save.equippedGearStyles?.[slot.bound] : null
    const shellGear = shell ? gearOfferById[shell.definitionId] : null
    const assetId = (shellGear && shell ? gearSpriteId(shellGear,getGearGrade(shell.refinementLevel)) : null) ?? (linked && boundInstance ? (linked.assetIdByGrade[boundInstance.grade] ?? linked.assetIdByGrade[1])
      : ordinary?.iconAssetId ?? starter?.definition.iconAssetId)
    const name = shellGear?.name ?? linked?.name ?? ordinary?.name ?? starter?.definition.name ?? 'Slot vazio'
    const actionable = Boolean(worn || starter || shell)
    const Icon = slot.icon
    return <button key={slot.id} type="button" className={`equipment-grid__slot ${assetId ? 'is-equipped' : 'is-empty'}`}
      aria-label={`${slot.label}: ${name}${actionable ? ', clique para desequipar' : ''}`}
      title={`${slot.label} · ${name}${shellGear && shell ? ' · '+formatGearStats(shellGear,getGearGrade(shell.refinementLevel)) : ''}${actionable ? ' · desequipar' : ''}`}
      disabled={!actionable || Boolean(save.battle)}
      onClick={() => {
        if (slot.complementary && worn) equipComplementary(slot.complementary, null)
        else if (shell && slot.bound) equipGearStyle(slot.bound, null)
        else if (starter) equipArmor(null)
      }}>
      {assetId ? <AssetImage assetId={assetId} alt="" /> : <Icon size={21} />}
      <span>{slot.label}</span>
      {shellGear && shell && <small>T{shellGear.tier} G{getGearGrade(shell.refinementLevel)}</small>}
      {boundInstance && !shellGear && <small>Vínculo G{boundInstance.grade}</small>}
    </button>
  }
  const braceletId = save.character.bondedEquipment.bracelet
  const bracelet = braceletId ? save.boundItems[braceletId] : null
  const braceletDef = bracelet ? content.boundItemBases[bracelet.baseItemId] : null
  const braceletShell = save.equippedGearStyles?.bracelet
  const braceletGear = braceletShell ? gearOfferById[braceletShell.definitionId] : null
  return <section className="equipment-grid" aria-label="Equipamentos do Terrírian">
    <div className="equipment-grid__slots">{slots.map(renderSlot)}</div>
    <div className="equipment-grid__bracelet" title={`${braceletGear?.name ?? braceletDef?.name ?? 'Pulseira não vinculada'}${braceletGear && braceletShell ? ' · '+formatGearStats(braceletGear,getGearGrade(braceletShell.refinementLevel)) : ''}`}>
      <Watch size={14} aria-hidden="true" />
      <strong>Pulseira</strong>
      <span>{braceletGear?.name ?? braceletDef?.name ?? 'Vazia'}{braceletGear ? ` · T${braceletGear.tier} G${getGearGrade(braceletShell?.refinementLevel)}` : bracelet ? ` · Vínculo G${bracelet.grade}` : ''}</span>
      {braceletShell && <button type="button" disabled={Boolean(save.battle)} onClick={() => equipGearStyle('bracelet',null)}>Retirar revestimento</button>}
    </div>
    <p>Peças comuns são equipadas pela Mochila; Vínculos continuam permanentes.</p>
  </section>
}
