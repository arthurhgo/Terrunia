import { Link2, LockKeyhole, Sword, Waypoints } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BOUND_SLOTS, BOUND_SLOT_LABELS } from '../../domain/shared/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameButton } from '../components/GameButton'

export function PrologueScreen() {
  const save = useGameStore((state) => state.save)
  const bindWeapon = useGameStore((state) => state.bindPrologueWeapon)
  const navigate = useNavigate()

  if (!save) return <Navigate to="/character/create" replace />
  if (save.character.bondedEquipment.weapon) return <Navigate to="/terran" replace />

  const complete = () => {
    bindWeapon()
    navigate('/terran')
  }

  return (
    <main className="prologue-screen">
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
      </section>

      <ArcanePanel title="Rede de Vínculos" subtitle="Estado inicial do personagem" className="prologue-bindings">
        <div className="prologue-slots">
          {BOUND_SLOTS.map((slot, index) => (
            <article key={slot} className={slot === 'weapon' ? 'prologue-slot prologue-slot--ready' : 'prologue-slot'}>
              {slot === 'weapon' ? <Sword size={28} /> : <LockKeyhole size={24} />}
              <span>{BOUND_SLOT_LABELS[slot]}</span>
              <small>{slot === 'weapon' ? 'Pronto para Vínculo G1' : `Será obtido no prólogo · etapa ${index + 1}`}</small>
            </article>
          ))}
        </div>
        <GameButton variant="primary" full onClick={complete}>
          <Waypoints size={18} /> Executar Vínculo da Arma — Grau I
        </GameButton>
      </ArcanePanel>
    </main>
  )
}
