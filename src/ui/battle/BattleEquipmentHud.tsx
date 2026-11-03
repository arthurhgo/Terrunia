import { useEffect, useId, useMemo, useState, type FocusEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { content } from '../../content/catalog'
import { boundSlotPreviewAssetIds } from '../../assets/assetRegistry'
import { getBattleGearSummary, type BattleGearSlot, type BattleGearStatKey } from '../../domain/combat/battleEquipment'
import type { GameSave } from '../../domain/game/types'
import type { BoundSlot } from '../../domain/shared/types'
import { AssetImage } from '../components/AssetImage'
import './battleEquipmentHud.css'

type VisibleDetail = { slot: BoundSlot; pinned: boolean; left: number; top: number }
const shortLabels: Record<BoundSlot, string> = {
  weapon: 'Arma', shield: 'Escudo', armor: 'Armadura', necklace: 'Colar', bracelet: 'Pulseira',
}
const summaryLabels: Record<BattleGearStatKey, string> = {
  attack: 'Poder', defense: 'Def', life: 'Vida', mana: 'Mana', initiative: 'Inic',
}
const summaryOrder: BattleGearStatKey[] = ['attack', 'defense', 'life', 'mana', 'initiative']
const signed = (value: number) => value > 0 ? `+${value}` : value === 0 ? '0' : String(value)

function positionDetail(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const width = Math.min(285, window.innerWidth - 16)
  const left = rect.right + width + 12 <= window.innerWidth
    ? rect.right + 10 : Math.max(8, rect.left - width - 10)
  const top = Math.max(8, Math.min(rect.top - 8, window.innerHeight - 280))
  return { left, top }
}

/** Read-only combat equipment HUD. Hover/focus gives a temporary tooltip;
 * click/tap pins details without equipping, swapping or mutating the save.
 */
export function BattleEquipmentHud({ save }: { save: GameSave }) {
  const { slots, totals } = useMemo(() => getBattleGearSummary(save, content), [save])
  const [visible, setVisible] = useState<VisibleDetail | null>(null)
  const tooltipId = useId()
  const selected = visible ? slots.find((slot) => slot.slot === visible.slot) : null
  const bonuses = summaryOrder
    .filter((stat) => totals[stat] !== 0)
    .map((stat) => `${summaryLabels[stat]} ${signed(totals[stat])}`)

  const show = (slot: BoundSlot, element: HTMLElement, pinned: boolean) => {
    setVisible((current) => {
      if (!pinned && current?.pinned) return current
      if (pinned && current?.slot === slot && current.pinned) return null
      return { slot, pinned, ...positionDetail(element) }
    })
  }
  const release = (slot: BoundSlot) =>
    setVisible((current) => current?.slot === slot && !current.pinned ? null : current)

  useEffect(() => {
    if (!visible) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setVisible(null)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!visible.pinned) return
      const element = event.target
      if (!(element instanceof Element)) return
      if (!element.closest('[data-gear-slot]') && !element.closest('[data-gear-tooltip]')) setVisible(null)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [visible])

  return <>
    <div className="battle-gear" aria-label="Equipamentos utilizados no combate">
      <div className="battle-gear__slots" aria-label="Cinco slots de equipamentos">
        {slots.map((slot) => <button key={slot.slot} type="button"
          data-gear-slot={slot.slot} data-gear-state={slot.state}
          className={`battle-gear__slot ${visible?.slot === slot.slot ? 'is-inspected' : ''}`}
          aria-label={`${slot.label}: ${slot.state === 'empty' ? 'Não equipado' : slot.name}`}
          aria-disabled={slot.state === 'empty'}
          aria-expanded={visible?.slot === slot.slot && visible.pinned}
          aria-describedby={visible?.slot === slot.slot ? tooltipId : undefined}
          onMouseEnter={(event: MouseEvent<HTMLButtonElement>) => show(slot.slot, event.currentTarget, false)}
          onMouseLeave={() => release(slot.slot)}
          onFocus={(event: FocusEvent<HTMLButtonElement>) => show(slot.slot, event.currentTarget, false)}
          onBlur={() => release(slot.slot)}
          onClick={(event) => show(slot.slot, event.currentTarget, true)}>
          <AssetImage assetId={slot.assetId ?? boundSlotPreviewAssetIds[slot.slot]} alt="" aria-hidden="true" />
          <span className="battle-gear__slot-name">{shortLabels[slot.slot]}</span>
          {slot.state === 'bound' && <span className="battle-gear__grade" aria-hidden="true">{slot.tierLabel.match(/\d+/)?.[0] && `G${slot.tierLabel.match(/\d+/)?.[0]}`}</span>}
          {slot.state === 'simple' && <span className="battle-gear__simple-mark" aria-hidden="true">T{slot.tierLabel.match(/Tier (\d+)/)?.[1]}</span>}
        </button>)}
      </div>
      <div className="battle-gear__summary" aria-label="Bônus diretos dos equipamentos">
        <strong>BÔNUS DOS EQUIPAMENTOS</strong>
        <small>{bonuses.length ? bonuses.join(' · ') : 'Nenhum bônus direto ativo'}</small>
      </div>
    </div>
    {selected && visible && createPortal(
      <aside id={tooltipId} role={visible.pinned ? 'dialog' : 'tooltip'}
        aria-label={`Detalhes de ${selected.label}`}
        className="battle-gear-tooltip" data-gear-tooltip data-state={selected.state}
        style={{ left: visible.left, top: visible.top }}>
        {visible.pinned && <button type="button" className="battle-gear-tooltip__close"
          onClick={() => setVisible(null)} aria-label="Fechar detalhes do equipamento">×</button>}
        <span className="battle-gear-tooltip__category">{selected.label}</span>
        <h3>{selected.name}</h3>
        {selected.state === 'empty'
          ? <p className="battle-gear-tooltip__empty">Slot vazio. Nenhum equipamento equipado.</p>
          : <>
            <small>{selected.tierLabel}</small>
            {selected.resonance && <small>Ressonância: {selected.resonance.value}/{selected.resonance.required}</small>}
            <div className="battle-gear-tooltip__stats">
              {selected.stats.length
                ? selected.stats.map((stat, index) => <div key={`${stat.label}-${index}`}>
                    <span>{stat.label}</span><strong>{signed(stat.value)}</strong>
                  </div>)
                : <small>Sem bônus diretos de combate cadastrados.</small>}
            </div>
            <p>{selected.description}</p>
          </>}
      </aside>, document.body)}
  </>
}
