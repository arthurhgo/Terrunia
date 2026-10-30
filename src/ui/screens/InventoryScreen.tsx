import { Navigate, useSearchParams } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { NexusOverview } from '../dashboard/NexusOverview'
import { AssetImage } from '../components/AssetImage'
import { GameShell } from '../components/GameShell'

export function InventoryScreen() {
  const save = useGameStore((state) => state.save)
  const [searchParams, setSearchParams] = useSearchParams()
  if (!save) return <Navigate to="/character/create" replace />

  const section = searchParams.get('section') === 'nexus' ? 'nexus' : 'inventory'
  const units = save.inventory.reduce((total, item) => total + item.quantity, 0)

  return (
    <GameShell fluid>
      <div className="inventory-screen">
        <header className="screen-heading">
          <p className="eyebrow">TERRÚNIA / ARQUIVO DO TERRÍRIAN</p>
          <h1>Inventário e Nexo</h1>
          <p>Seus recursos obtidos e os cinco Vínculos permanentes. O Arsenal Visual e o guia de jogo ficam na Estante dos Registros da Casa de Eldamar.</p>
        </header>
        <div className="inventory-screen__hero">
          <AssetImage assetId={save.character.portraitAssetId} />
          <div><span className="eyebrow">PERSONAGEM</span><strong>{save.character.name}</strong><small>{units} unidade(s) na mochila · {save.wallet.gold} Ouro</small></div>
          <span className="pixel-draft-label">GRADE 16×16 / 32×32</span>
        </div>
        <div className="inventory-nexus__tabs" role="group" aria-label="Seções de Inventário e Nexo">
          <button type="button" aria-pressed={section === 'inventory'} className={section === 'inventory' ? 'active' : ''}
            onClick={() => setSearchParams({})}>Inventário</button>
          <button type="button" aria-pressed={section === 'nexus'} className={section === 'nexus' ? 'active' : ''}
            onClick={() => setSearchParams({ section: 'nexus' })}>Nexo</button>
        </div>
        {section === 'inventory' ? <InventoryPanel save={save} /> : <NexusOverview save={save} />}
      </div>
    </GameShell>
  )
}
