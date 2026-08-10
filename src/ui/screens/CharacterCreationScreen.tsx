import { ArrowRight, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'

const portraits = [
  { id: 'character.terririan.default', label: 'Vigília Azul' },
  { id: 'character.terririan.sigil', label: 'Selo Violeta' },
]

export function CharacterCreationScreen() {
  const save = useGameStore((state) => state.save)
  const createGame = useGameStore((state) => state.createGame)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [portrait, setPortrait] = useState(portraits[0].id)

  if (save) return <Navigate to="/" replace />

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (name.trim().length < 2) return
    createGame(name, portrait)
    navigate('/new-game')
  }

  return (
    <main className="creation-screen">
      <section className="creation-intro">
        <img src="/assets/ui/terrunia-mark.svg" alt="" />
        <p className="eyebrow">NOVO JOGO</p>
        <h1>O Terrírian é o Nexo</h1>
        <p>
          Você não escolhe Clã, Classe ou herói histórico. Sua identidade será conquistada por relações, provas e decisões dentro de Terrúnia.
        </p>
        <ul className="principle-list">
          <li><span>01</span> Sem Clã inicial</li>
          <li><span>02</span> Sem Classe inicial</li>
          <li><span>03</span> Cinco vínculos ainda vazios</li>
        </ul>
      </section>

      <ArcanePanel title="Criar Terrírian" eyebrow="IDENTIDADE INICIAL" className="creation-form-panel">
        <form onSubmit={submit} className="creation-form">
          <label className="form-field">
            <span>Nome do personagem</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={28}
              autoFocus
              placeholder="Ex.: Aron"
              autoComplete="off"
            />
            <small>2–28 caracteres. O nome não altera IDs internos.</small>
          </label>

          <fieldset className="portrait-picker">
            <legend>Assinatura visual</legend>
            {portraits.map((option) => (
              <label key={option.id} className={portrait === option.id ? 'selected' : ''}>
                <input
                  type="radio"
                  name="portrait"
                  value={option.id}
                  checked={portrait === option.id}
                  onChange={() => setPortrait(option.id)}
                />
                <AssetImage assetId={option.id} />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>

          <div className="attribute-draft">
            <Sparkles size={18} />
            <div>
              <strong>Fundação neutra</strong>
              <p>Astúcia, Agilidade, Força, Vigor e Espírito começam em d6. A distribuição final permanece <code>OWNER_DECISION</code>.</p>
            </div>
          </div>

          <GameButton type="submit" variant="primary" full disabled={name.trim().length < 2}>
            Confirmar Terrírian <ArrowRight size={18} />
          </GameButton>
        </form>
      </ArcanePanel>
    </main>
  )
}
