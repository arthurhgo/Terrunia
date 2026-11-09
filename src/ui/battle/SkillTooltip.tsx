import { Clock3, X } from 'lucide-react'
import type { CombatSkillDefinition } from '../../content/types'
import type { previewCombatSkill } from '../../domain/combat/skillPreview'
import { AssetImage } from '../components/AssetImage'

type Preview = ReturnType<typeof previewCombatSkill>
export function SkillTooltip({ skill, preview, remaining, unavailable, onClose, onUse }: {
  skill: CombatSkillDefinition
  preview: Preview
  remaining: number
  unavailable: string | null
  onClose: () => void
  onUse: () => void
}) {
  return <aside id={`skill-tooltip-${skill.id}`} className="pixel-battle__skill-tooltip"
    role="tooltip" aria-label={`Detalhes de ${skill.name}`}>
    <button type="button" className="pixel-battle__skill-tooltip-close" aria-label="Fechar detalhes" onClick={onClose}><X size={16} /></button>
    <header><AssetImage assetId={skill.iconAssetId ?? `skill.${skill.id}`} alt="" />
      <div><strong>{skill.name}</strong><small>{skill.mpCost} MP · {skill.target === 'enemy' ? 'Alvo inimigo' : 'Em si mesmo'}</small></div>
    </header>
    <p>{skill.description}</p>
    <dl>
      <div><dt>Dado</dt><dd>{preview.die ? `d${preview.die}` : 'Não utiliza dado de dano'}</dd></div>
      <div><dt>Dano estimado {preview.ranges.length ? `· ${preview.targetName}` : ''}</dt>
        <dd>{preview.ranges.length
          ? preview.ranges.map(({ minimum, maximum }) => `${minimum}–${maximum}`).join(' + ')
          : 'Não causa dano direto'}</dd></div>
      <div><dt>Mana</dt><dd>{skill.mpCost} MP</dd></div>
      <div><dt><Clock3 size={13}/> Recarga</dt><dd>{skill.cooldownTurns ?? 0} turno(s) · {remaining > 0 ? `restam ${remaining}` : 'pronta'}</dd></div>
    </dl>
    {preview.effects.length > 0 && <div className="pixel-battle__skill-extra">
      <strong>Efeitos</strong>{preview.effects.map((effect, index) => <span key={index}>{effect}</span>)}
    </div>}
    {unavailable && <small className="pixel-battle__skill-warning">{unavailable}</small>}
    <button type="button" className="pixel-battle__skill-tooltip-use" disabled={Boolean(unavailable)} onClick={onUse}>USAR HABILIDADE</button>
  </aside>
}
