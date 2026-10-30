import { createPortal } from 'react-dom'
import { content } from '../../content/catalog'
import { collectionContractDefinitions } from '../../content/collectionContracts'
import type { TerranLandmark } from '../../content/terranExploration'
import type { GameSave } from '../../domain/game/types'
import { getQuestStatusLabel } from '../../domain/quests/questSelectors'
import { getDeliverableCount } from '../../domain/quests/questInventory'
import { AssetImage } from '../components/AssetImage'
import { Modal } from '../components/Modal'

export function CityLandmarkDialog({ landmark, save, onClose }: { landmark: TerranLandmark; save: GameSave; onClose: () => void }) {
  return createPortal(<Modal open title={landmark.name} eyebrow="EXPLORAÇÃO · TERRAN" onClose={onClose}
    className="city-landmark-dialog" footer={<button type="button" className="terran-service-action" onClick={onClose}>Continuar explorando</button>}>
    <p>{landmark.description}</p>
    {landmark.kind === 'board' && <section className="city-contracts" aria-label="Encomendas dos moradores">
      <p>◇ Encomendas de coleta · ouro na entrega · aceite com o responsável.</p>
      {collectionContractDefinitions.map((quest) => {
        const status = save.quests[quest.id]?.status ?? 'locked'
        const location = content.terranLocations[quest.terranFlow!.ready_to_turn_in!]
        return <article key={quest.id} className={`city-contract ${status === 'locked' ? 'is-locked' : ''}`}>
          <AssetImage assetId={content.npcs[quest.giverNpcId].portraitAssetId} />
          <div><h3>◇ {quest.title}</h3><small>{content.npcs[quest.giverNpcId].name} · {quest.giverNpcId.startsWith('npc_street_') ? `Ruas, perto de ${location.name}` : location.name} · {getQuestStatusLabel(status)}</small>
            <p>{quest.turnInItems!.map((input) => `${input.quantity} × ${content.items[input.itemId].name} (${getDeliverableCount(save, input.itemId, content)} na mochila)`).join(' · ')}</p>
            {status === 'locked' && <small>Disponível após: {content.quests[quest.prerequisites!.find((gate) => gate.type === 'questCompleted')!.questId].title}</small>}
          </div><strong>{quest.rewards.find((reward) => reward.type === 'gold')!.value} Ouro</strong>
        </article>
      })}
    </section>}
  </Modal>, document.body)
}
