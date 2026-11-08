import { BedDouble } from 'lucide-react'
import { Modal } from '../components/Modal'

/** Arrival at the bed is not a rest action. Only an explicit click can heal. */
export function HomeRestConfirmation({ open, onRest, onClose }: {
  open: boolean
  onRest: () => void
  onClose: () => void
}) {
  return <Modal open={open} title="Descansar na cama" eyebrow="BASE DO TERRÍRIAN"
    onClose={onClose} className="terran-base-rest-confirm">
    <p>Deseja descansar e recuperar Vida e Mana?</p>
    <div className="terran-base-functions__actions">
      <button type="button" className="terran-service-action" onClick={onRest}>
        <BedDouble size={17} /> Descansar
      </button>
      <button type="button" className="terran-service-action" onClick={onClose}>Fechar</button>
    </div>
  </Modal>
}
