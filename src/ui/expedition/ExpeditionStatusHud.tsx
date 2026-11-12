import { Backpack, BookOpen, Route, UserRound } from 'lucide-react'
import type { GameSave } from '../../domain/game/types'
import { content } from '../../content/catalog'
import { deriveCharacterStats } from '../../domain/character/derivedStats'
import { CharacterPortrait } from '../characters/CharacterSprite'
import './expeditionStatusHud.css'

type Tab = 'inventory' | 'character' | 'quests' | 'trail'

/** A read-only combat-safe HUD, visible over external exploration and dungeons. */
export function ExpeditionStatusHud({ save, selected, onOpen }: {
  save: GameSave
  selected: string | null
  onOpen: (tab: Tab) => void
}) {
  const stats = deriveCharacterStats(save, content)
  const hp = Math.max(0, Math.min(100, (save.vitals.hp / stats.life.value) * 100))
  const mp = Math.max(0, Math.min(100, (save.vitals.mp / stats.mana.value) * 100))
  return <aside className="expedition-status-hud" aria-label="Personagem, Vida, Mana e ações da trilha">
    <nav className="expedition-status-hud__actions" aria-label="Ações rápidas da trilha">
      {([
        { id: 'inventory' as const, label: 'Mochila', icon: Backpack },
        { id: 'character' as const, label: 'Personagem', icon: UserRound },
        { id: 'trail' as const, label: 'Rota', icon: Route },
        { id: 'quests' as const, label: 'Missões', icon: BookOpen },
      ]).map(({ id, label, icon: Icon }) => <button type="button" key={id}
        aria-label={`Abrir ${label}`} aria-pressed={selected === id}
        className={selected === id ? 'is-active' : ''} onClick={() => onOpen(id)}>
        <Icon size={14}/><span>{label}</span>
      </button>)}
    </nav>
    <div className="expedition-status-hud__identity">
      <span className="expedition-status-hud__portrait"><CharacterPortrait appearance={save.character.appearance}
        portraitAssetId={save.character.portraitAssetId} alt={`Rosto de ${save.character.name}`}/></span>
      <div className="expedition-status-hud__vitals">
        <strong>{save.character.name} <small>LV {save.character.level}</small></strong>
        <label>VIDA <span>{save.vitals.hp}/{stats.life.value}</span></label>
        <div className="expedition-status-hud__bar is-hp" role="progressbar" aria-label="Vida"
          aria-valuenow={save.vitals.hp} aria-valuemin={0} aria-valuemax={stats.life.value}><i style={{ width: hp + '%' }}/></div>
        <label>MANA <span>{save.vitals.mp}/{stats.mana.value}</span></label>
        <div className="expedition-status-hud__bar is-mp" role="progressbar" aria-label="Mana"
          aria-valuenow={save.vitals.mp} aria-valuemin={0} aria-valuemax={stats.mana.value}><i style={{ width: mp + '%' }}/></div>
      </div>
    </div>
  </aside>
}
