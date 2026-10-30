import { Navigate } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { BoundItemsPanel } from '../dashboard/BoundItemsPanel'
import { GameShell } from '../components/GameShell'

export function InventoryScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />

  const units = save.inventory.reduce((total, item) => total + item.quantity, 0)

  return (
    <GameShell fluid>
      <div className="inventory-screen">
        <header className="screen-heading">
          <p className="eyebrow">TERRÚNIA / ARQUIVO DO TERRÍRIAN</p>
          <h1>Inventário</h1>
          <p>Seus recursos obtidos e os cinco Vínculos permanentes. O Arsenal Visual e o guia de jogo ficam na Estante dos Registros da Casa de Eldamar.</p>
        </header>
        <p className="inventory-screen__summary">{units} unidade(s) na mochila · {save.wallet.gold} Ouro</p>
        <div className="inventory-nexus__unified" aria-label="Mochila e Vínculos">
          <div id="inventario"><InventoryPanel save={save} /></div>
          <BoundItemsPanel save={save} />
        </div>
      </div>
    </GameShell>
  )
}
