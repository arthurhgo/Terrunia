import { CircleHelp, ShieldQuestion, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { GameSave } from '../../domain/game/types'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { ProgressBar } from '../components/ProgressBar'

const attributeLabels = {
  cunning: 'Astúcia',
  agility: 'Agilidade',
  strength: 'Força',
  vigor: 'Vigor',
  spirit: 'Espírito',
} as const

export function StatusPanel({ save }: { save: GameSave }) {
  const { character, essence } = save
  return (
    <ArcanePanel title="Status" eyebrow="QUEM EU SOU" className="status-panel" as="aside">
      <div className="character-summary">
        <div className="portrait-frame">
          <AssetImage assetId={character.portraitAssetId} />
          <span className="portrait-frame__level">{character.level}</span>
        </div>
        <div className="character-summary__identity">
          <p className="eyebrow">TERRÍRIAN</p>
          <h3>{character.name}</h3>
          <ProgressBar value={character.xp} max={character.xpRequired} label={`Nível ${character.level}`} compact />
          <dl className="identity-list">
            <div><dt>Classe</dt><dd>{character.classProgression.classId ?? 'Sem Classe'}</dd></div>
            <div><dt>Clã</dt><dd>{character.clan.clanId ?? 'Sem Vínculo'}</dd></div>
          </dl>
        </div>
      </div>

      <div className="status-section">
        <h3>Atributos</h3>
        <div className="attribute-grid">
          {Object.entries(character.attributes).map(([id, value]) => (
            <div key={id} className="attribute-row">
              <span>{attributeLabels[id as keyof typeof attributeLabels]}</span>
              <strong>d{value.die}{value.bonus > 0 ? ` +${value.bonus}` : ''}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="status-section essence-section">
        <div className="status-section__title">
          <span><Sparkles size={16} /> Essência</span>
          <strong>{essence.essencePoints} pt.</strong>
        </div>
        <ProgressBar value={essence.current} max={essence.required} label="Barra de Essência" tone="essence" />
        <p>Ao completar a barra, você recebe <strong>1 Ponto de Essência</strong>. O excedente é preservado.</p>
      </div>

      <div className="clan-progress-card">
        <div className="mystery-crest"><ShieldQuestion size={34} /></div>
        <div>
          <p className="eyebrow">PROGRESSO DO CLÃ</p>
          <h3>Sem Vínculo</h3>
          <p>Conheça representantes e complete provas dentro do mundo.</p>
        </div>
        <CircleHelp size={17} aria-label="Clãs são descobertos durante a jornada" />
      </div>

      <Link to="/skill-tree" className="panel-link">Abrir Skill Tree <span>→</span></Link>
    </ArcanePanel>
  )
}
