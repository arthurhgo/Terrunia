import { BookHeart, History, ScrollText } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'
import { GameShell } from '../components/GameShell'
import { ArcanePanel } from '../components/ArcanePanel'
import { NexusOverview } from '../dashboard/NexusOverview'
import { BoundItemsPanel } from '../dashboard/BoundItemsPanel'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import './characterHub.css'

/** Nexo + character sheet + backpack share one screen and a single status source. */
export function NexusScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />

  const memories = Object.values(save.boundItems).flatMap((item) => item.memories)
  const units = save.inventory.reduce((total, item) => total + item.quantity, 0)

  return <GameShell fluid>
    <section className="character-hub" aria-label="Personagem, itens e mochila">
      <header className="character-hub__header screen-heading">
        <div>
          <p className="eyebrow">TERRÚNIA · NEXO DO TERRÍRIAN</p>
          <h1>Personagem</h1>
          <p>Status, equipamentos e recursos em uma única tela.</p>
        </div>
        <nav className="character-hub__jump" aria-label="Seções do personagem">
          <a href="#status">Status</a>
          <a href="#equipamentos">Itens</a>
          <a href="#mochila">Mochila</a>
          <a href="#historico">Histórico</a>
        </nav>
      </header>

      <div className="character-hub__overview">
        <section id="status" aria-label="Status e progressão do personagem">
          <NexusOverview save={save} />
        </section>
        <section id="equipamentos" aria-label="Equipamentos em uso">
          <BoundItemsPanel save={save} />
        </section>
      </div>

      <section id="mochila" className="character-hub__backpack" aria-label="Recursos e itens não equipados">
        <p className="character-hub__balance">{units} unidade(s) na mochila · {save.wallet.gold} Ouro</p>
        <InventoryPanel save={save} />
      </section>

      <details id="historico" className="character-hub__history">
        <summary><ScrollText size={18} aria-hidden="true" />
          Histórico e memórias
          <small>{memories.length} memória(s) · {save.character.titleIds.length} título(s)</small>
        </summary>
        <div className="character-hub__history-grid">
          <ArcanePanel title="Memórias" eyebrow="MARCAS DA JORNADA">
            {memories.length
              ? <div className="character-hub__memories">{memories.map((memory) =>
                  <article key={memory.id}><BookHeart size={17} /><div><strong>{memory.title}</strong><p>{memory.description}</p></div></article>)}</div>
              : <p>Nenhuma Memória inscrita nos Vínculos.</p>}
          </ArcanePanel>
          <ArcanePanel title="Crônica" eyebrow="ÚLTIMOS ACONTECIMENTOS">
            <div className="event-chronicle">
              {save.eventLog.slice(-12).reverse().map((event, index) =>
                <span key={`${event}-${index}`}><History size={13} aria-hidden="true" />{event}</span>)}
            </div>
          </ArcanePanel>
        </div>
      </details>
    </section>
  </GameShell>
}
