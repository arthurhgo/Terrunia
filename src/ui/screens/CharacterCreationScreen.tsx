import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ATTRIBUTE_IDS, type AttributeId } from '../../domain/game/types'
import { Navigate, useNavigate } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'
import { BALANCE } from '../../content/balance'
import {
  APPEARANCE_CLOTH_PALETTE, APPEARANCE_EYE_PALETTE, APPEARANCE_HAIR_PALETTE,
  APPEARANCE_SKIN_PALETTE, BEARD_STYLES, BODY_FRAMES, BODY_PRESENTATIONS,
  DEFAULT_CHARACTER_APPEARANCE, FACE_STYLES, HAIR_STYLES, OUTFIT_STYLES,
  type CharacterAppearance,
} from '../../domain/character/appearance'
import { CharacterSprite, CharacterPortrait } from '../characters/CharacterSprite'
import type { ActorFacing } from '../terran/pixelActorArt'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameButton } from '../components/GameButton'
import './characterCreator.css'

const appearanceLabels: Record<string, string> = {
  masculino: 'Masculino', feminino: 'Feminino', neutro: 'Neutro',
  leve: 'Leve', medio: 'Equilibrado', robusto: 'Robusto',
  suave: 'Suave', angular: 'Angular', redondo: 'Redondo',
  curto: 'Curto', longo: 'Longo', trancas: 'Tranças', cacheado: 'Cacheado', raspado: 'Raspado',
  nenhuma: 'Sem barba', curta: 'Barba curta', cheia: 'Barba cheia',
  tunica: 'Túnica simples', manto: 'Manto arcano', aventureiro: 'Traje aventureiro',
}
type TextAppearanceKey = {
  [K in keyof CharacterAppearance]: CharacterAppearance[K] extends string ? K : never
}[keyof CharacterAppearance]

export function CharacterCreationScreen() {
  const save = useGameStore((state) => state.save)
  const createGame = useGameStore((state) => state.createGame)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [appearance, setAppearance] = useState<CharacterAppearance>({ ...DEFAULT_CHARACTER_APPEARANCE })
  const [submitting, setSubmitting] = useState(false)
  const [facing, setFacing] = useState<ActorFacing>('down')
  const [invested, setInvested] = useState<Record<AttributeId, number>>({
    cunning: 0, agility: 0, strength: 0, vigor: 0, spirit: 0,
  })
  const pointsLeft = BALANCE.characterCreationAttributePoints -
    ATTRIBUTE_IDS.reduce((sum, id) => sum + invested[id], 0)
  const attributeLabels: Record<AttributeId, string> = {
    cunning: 'Astúcia', agility: 'Agilidade', strength: 'Força', vigor: 'Vigor', spirit: 'Espírito',
  }
  const investPoint = (id: AttributeId, change: 1 | -1) => setInvested((current) => {
    const total = ATTRIBUTE_IDS.reduce((sum, key) => sum + current[key], 0)
    const next = current[id] + change
    if (next < 0 || next > 8 || (change === 1 && total >= BALANCE.characterCreationAttributePoints)) return current
    return { ...current, [id]: next }
  })

  if (save) return <Navigate to="/character/access" replace />

  const set = (key: TextAppearanceKey, value: string) =>
    setAppearance((current) => ({ ...current, [key]: value }))
  const randomize = () => {
    const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]
    setAppearance({
      presentation: pick(BODY_PRESENTATIONS), frame: pick(BODY_FRAMES), skinTone: pick(APPEARANCE_SKIN_PALETTE),
      face: pick(FACE_STYLES), hairStyle: pick(HAIR_STYLES), hairColor: pick(APPEARANCE_HAIR_PALETTE),
      eyeColor: pick(APPEARANCE_EYE_PALETTE), beard: pick(BEARD_STYLES), outfit: pick(OUTFIT_STYLES),
      outfitPrimary: pick(APPEARANCE_CLOTH_PALETTE), outfitSecondary: pick(APPEARANCE_CLOTH_PALETTE),
    })
  }
  const selectField = (key: TextAppearanceKey, title: string, values: readonly string[]) => (
    <label className="character-creator__field" key={key}>
      <span>{title}</span>
      <select value={appearance[key]} onChange={(event) => set(key, event.target.value)}>
        {values.map((value) => <option value={value} key={value}>{appearanceLabels[value] ?? value}</option>)}
      </select>
    </label>
  )
  const colorField = (key: TextAppearanceKey, title: string, palette: readonly string[]) => (
    <label className="character-creator__field character-creator__color" key={key}>
      <span>{title}</span>
      <div>
        <input type="color" value={appearance[key]} onChange={(event) => set(key, event.target.value)} aria-label={title} />
        <select value={palette.includes(appearance[key]) ? appearance[key] : 'custom'}
          aria-label={`Paleta: ${title}`} onChange={(event) => { if (event.target.value !== 'custom') set(key, event.target.value) }}>
          {palette.map((value, index) => <option key={value} value={value}>Cor {index + 1}</option>)}
          {!palette.includes(appearance[key]) && <option value="custom">Personalizada</option>}
        </select>
      </div>
    </label>
  )
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (name.trim().length < 2 || submitting || pointsLeft !== 0) return
    setSubmitting(true)
    void createGame(name, 'character.terririan.default', appearance, invested)
      .then((created) => { if (created) navigate('/new-game') })
      .finally(() => setSubmitting(false))
  }

  return <main className="creation-screen character-creator">
    <section className="creation-intro">
      <img src="/assets/ui/terrunia-mark.svg" alt="" />
      <p className="eyebrow">NOVO JOGO · IDENTIDADE</p>
      <h1>O Terrírian é o Nexo</h1>
      <p>Crie sua aparência antes de iniciar a jornada. Clã e Classe só serão conquistados dentro de Terrúnia.</p>
      <div className="character-creator__preview" aria-label="Prévia do sprite do Terrírian" aria-live="polite">
        <span className="character-creator__preview-orbit" aria-hidden="true" />
        <CharacterSprite appearance={appearance} facing={facing} className="character-creator__sprite" alt="Prévia da aparência escolhida" />
        <span className="character-creator__face-preview" aria-label="Detalhes do rosto">
          <CharacterPortrait appearance={appearance} alt="Rosto personalizado" />
        </span>
        <strong>{name.trim() || 'Seu Terrírian'}</strong>
        <small>Pixel art modular · prévia imediata</small>
      </div>
      <div className="character-creator__directions" aria-label="Visualizar personagem por direção">
        {([
          { id: 'down', title: 'Frente' }, { id: 'left', title: 'Esquerda' },
          { id: 'right', title: 'Direita' }, { id: 'up', title: 'Costas' },
        ] as { id: ActorFacing; title: string }[]).map(({ id, title }) =>
          <button key={id} type="button" aria-pressed={facing === id}
            className={facing === id ? 'is-selected' : ''}
            onClick={() => setFacing(id)}>{title}</button>)}
      </div>
      <div className="character-creator__quick">
        <button type="button" onClick={randomize}>Surpreender</button>
        <button type="button" onClick={() => setAppearance({ ...DEFAULT_CHARACTER_APPEARANCE })}>
          <RotateCcw size={14}/> Restaurar
        </button>
      </div>
    </section>
    <ArcanePanel title="Criar Terrírian" eyebrow="PERSONALIZAÇÃO VISUAL" className="creation-form-panel">
      <form onSubmit={submit} className="creation-form">
        <label className="form-field">
          <span>Nome do personagem</span>
          <input value={name} onChange={(event) => setName(event.target.value)} minLength={2}
            maxLength={28} autoFocus placeholder="Ex.: Aron" autoComplete="off" />
          <small>2–28 caracteres · sem alteração dos IDs internos.</small>
        </label>

        <fieldset className="character-creator__group">
          <legend>Corpo e aparência</legend>
          <div className="character-creator__fields">
            {selectField('presentation', 'Sexo / apresentação', BODY_PRESENTATIONS)}
            {selectField('frame', 'Porte físico', BODY_FRAMES)}
            {selectField('face', 'Rosto', FACE_STYLES)}
            {colorField('skinTone', 'Tom de pele', APPEARANCE_SKIN_PALETTE)}
            {colorField('eyeColor', 'Cor dos olhos', APPEARANCE_EYE_PALETTE)}
          </div>
        </fieldset>
        <fieldset className="character-creator__group">
          <legend>Cabelo e detalhes</legend>
          <div className="character-creator__fields">
            {selectField('hairStyle', 'Estilo do cabelo', HAIR_STYLES)}
            {colorField('hairColor', 'Cor do cabelo', APPEARANCE_HAIR_PALETTE)}
            {selectField('beard', 'Barba', BEARD_STYLES)}
          </div>
        </fieldset>
        <fieldset className="character-creator__group">
          <legend>Vestimenta inicial</legend>
          <div className="character-creator__fields">
            {selectField('outfit', 'Estilo do traje', OUTFIT_STYLES)}
            {colorField('outfitPrimary', 'Cor principal', APPEARANCE_CLOTH_PALETTE)}
            {colorField('outfitSecondary', 'Cor secundária', APPEARANCE_CLOTH_PALETTE)}
          </div>
        </fieldset>
        <fieldset className="character-creator__group character-creator__attributes" aria-label="Distribuir atributos na criação">
          <legend><Sparkles size={15} /> Fundação neutra · {pointsLeft} pontos restantes</legend>
          <p>Adicione um ponto por clique. O primeiro dá d4 + 1; o segundo evolui para d6. Distribua todos os seis pontos para criar.</p>
          <div className="character-creator__attribute-rows">
            {ATTRIBUTE_IDS.map((id) => <div className="character-creator__attribute-row" key={id}>
              <strong>{attributeLabels[id]}</strong>
              <button type="button" aria-label={`Retirar ponto de ${attributeLabels[id]}`}
                disabled={invested[id] === 0} onClick={() => investPoint(id, -1)}>−</button>
              <output aria-label={`Dado de ${attributeLabels[id]}`}>
                d{4 + 2 * Math.floor(invested[id] / 2)}{invested[id] % 2 ? ' + 1' : ''}
              </output>
              <button type="button" aria-label={`Adicionar ponto de ${attributeLabels[id]}`}
                disabled={pointsLeft === 0 || invested[id] === 8} onClick={() => investPoint(id, 1)}>+</button>
            </div>)}
          </div>
        </fieldset>
        <small className="creation-visual-note">A aparência é independente do gameplay. Os sprites podem ser substituídos via assetRegistry em atualizações futuras.</small>
        <GameButton type="submit" variant="primary" full disabled={name.trim().length < 2 || submitting || pointsLeft !== 0}>
          {submitting ? 'Salvando Terrírian…' : 'Confirmar e continuar'} <ArrowRight size={18} />
        </GameButton>
      </form>
    </ArcanePanel>
  </main>
}
