import { Navigate } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'
import { BoundItemsPanel } from '../dashboard/BoundItemsPanel'
import { EquipmentCatalog } from '../dashboard/EquipmentCatalog'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { AssetImage } from '../components/AssetImage'
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
          <h1>Inventário e Equipamentos</h1>
          <p>Seus recursos obtidos, os cinco Vínculos permanentes e a biblioteca de armas em pixel art.</p>
        </header>
        <div className="inventory-screen__hero">
          <AssetImage assetId={save.character.portraitAssetId} />
          <div><span className="eyebrow">PERSONAGEM</span><strong>{save.character.name}</strong><small>{units} unidade(s) na mochila · {save.wallet.gold} Ouro</small></div>
          <span className="pixel-draft-label">GRADE 16×16 / 32×32</span>
        </div>
        <BoundItemsPanel save={save} />
        <div className="inventory-screen__columns">
          <InventoryPanel save={save} />
          <EquipmentCatalog />
        </div>
      </div>
    </GameShell>
  )
}
