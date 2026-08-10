import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'
import { BoundItemsPanel } from '../dashboard/BoundItemsPanel'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { NpcDialog } from '../dashboard/NpcDialog'
import { PortalPanel } from '../dashboard/PortalPanel'
import { StatusPanel } from '../dashboard/StatusPanel'
import { GameShell } from '../components/GameShell'

export function TerranScreen() {
  const save = useGameStore((state) => state.save)
  const [npcOpen, setNpcOpen] = useState(false)
  if (!save) return <Navigate to="/character/create" replace />

  return (
    <GameShell fluid>
      <div className="dashboard">
        <StatusPanel save={save} />
        <div className="dashboard__center">
          <BoundItemsPanel save={save} />
          <InventoryPanel save={save} />
          <div className="economy-strip">
            <span><i className="essence-gem" /> Essência <strong>{save.essence.current}</strong></span>
            <span><i className="essence-gem" /> Pontos <strong>{save.essence.essencePoints}</strong></span>
            <span><i className="gold-coin" /> Ouro <strong>{save.wallet.gold.toLocaleString('pt-BR')}</strong></span>
          </div>
        </div>
        <PortalPanel save={save} onTalk={() => setNpcOpen(true)} />
      </div>
      <NpcDialog open={npcOpen} onClose={() => setNpcOpen(false)} save={save} />
    </GameShell>
  )
}
