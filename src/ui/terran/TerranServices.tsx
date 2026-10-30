import { DialogueWindow } from './DialogueWindow'
import { BedDouble, Check, Coins, HeartPulse, ShoppingBasket, Archive, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { content } from '../../content/catalog'
import { deriveCharacterStats } from '../../domain/character/derivedStats'
import type { GameSave } from '../../domain/game/types'
import { PLAYER_HOME_FLAG, SYLWEN_STOCK } from '../../domain/terran/services'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import { ProgressBar } from '../components/ProgressBar'

// VISUAL_DRAFT: mapa de pixels 20×12, sem dependência entre arte e lógica.
const homePixels = [
  'XXXXXXXXXXXXXXXXXXXX',
  'XeeeeeeeeeeeeeeeeeeX',
  'Xe............w...eX',
  'Xe.bbbbbbb....w...eX',
  'Xe.bhhhhhb........eX',
  'Xe.bhhhhhb........eX',
  'Xe.bbbbbbb....tt..eX',
  'Xe............tt..eX',
  'Xe................eX',
  'Xe...rrr..........eX',
  'Xe...rrr..........eX',
  'XXXXXXXXXXXXXXXXXXXX',
]
const pixelColors: Record<string, string> = {
  X: '#243934', e: '#52715a', '.': '#ab865c', b: '#403d50', h: '#c3b19a',
  w: '#70b9b4', t: '#815b43', r: '#986c4a',
}

export function HomeRoomPixels() {
  return <div className="terran-home-pixels" role="img" aria-label="Quarto pixelado com cama, janela, mesa e tapete">
    {homePixels.join('').split('').map((pixel, index) => (
      <span key={index} style={{ backgroundColor: pixelColors[pixel] ?? '#ab865c' }} />
    ))}
  </div>
}

export function HomeDrawer({ save, canRest = false }: { save: GameSave; canRest?: boolean }) {
  const rest = useGameStore((state) => state.restAtHome)
  const prepared = save.world.worldFlags.includes(PLAYER_HOME_FLAG)
  const stats = deriveCharacterStats(save, content)
  return <div className="terran-drawer__section">
    <HomeRoomPixels />
    <p><BedDouble size={17} /> <strong>Base do Terrírian</strong></p>
    <p>Seu refúgio particular em Terran. É possível entrar desde o início, guardar materiais no baú e recuperar Vida e Mana na cama.</p>
    <small>{prepared ? 'Alojamento preparado com Daeryn.' : 'A missão de Daeryn permite preparar e reconhecer seu alojamento, sem bloquear a entrada.'}</small>
    <ProgressBar value={save.vitals.hp} max={stats.life.value} label="Vida atual" tone="health" />
    <ProgressBar value={save.vitals.mp} max={stats.mana.value} label="Mana atual" />
    <button type="button" className="terran-service-action" disabled={Boolean(save.battle) || !canRest} onClick={rest}>
      <BedDouble size={17} /> {canRest ? 'Descansar · Recuperar PV e MP' : 'Entre na Base para descansar'}
    </button>
  </div>
}

export function BaseChest({ save }: { save: GameSave }) {
  const transfer = useGameStore((state) => state.transferBaseItem)
  const renderList = (items: GameSave['inventory'], direction: 'deposit' | 'withdraw') =>
    items.length ? items.map((item) => {
      const definition = content.items[item.definitionId]
      return <div className="base-chest__item" key={item.instanceId}>
        <AssetImage assetId={definition?.iconAssetId ?? 'item.fungal-nucleus'} />
        <div><strong>{definition?.name ?? item.definitionId}</strong><small>×{item.quantity}{item.locked ? ' · travado' : ''}</small></div>
        <button type="button" disabled={item.locked && direction === 'deposit'}
          aria-label={`${direction === 'deposit' ? 'Guardar' : 'Retirar'} ${definition?.name ?? item.definitionId}`}
          onClick={() => transfer(direction, item.instanceId, item.quantity)}>
          {direction === 'deposit' ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}
          {direction === 'deposit' ? 'Guardar' : 'Retirar'}
        </button>
      </div>
    }) : <p>{direction === 'deposit' ? 'A mochila está vazia.' : 'O baú está vazio.'}</p>
  return <section className="base-chest" aria-label="Baú pessoal da Base">
    <h3><Archive size={20} /> Baú da Base</h3>
    <p>Itens e materiais temporários são armazenados apenas neste personagem. Os cinco itens vinculados permanecem equipados.</p>
    <h4>Mochila</h4>{renderList(save.inventory, 'deposit')}
    <h4>Armazenado na Base</h4>{renderList(save.baseStorage, 'withdraw')}
  </section>
}

export function SylwenShop({ save }: { save: GameSave }) {
  const buy = useGameStore((state) => state.buyFromSylwen)
  return <section className="terran-shop" aria-label="Balcão de Sylwen">
    <h3><ShoppingBasket size={18} /> Balcão de Sylwen</h3>
    <p>Alquimia básica · estoque de desenvolvimento (BALANCE_DRAFT)</p>
    <p className="terran-shop__wallet"><Coins size={17} /> {save.wallet.gold} Ouro disponível</p>
    <div className="terran-shop__stock">
      {SYLWEN_STOCK.map(({ itemId, price }) => {
        const item = content.items[itemId]
        return <article key={itemId}>
          <AssetImage assetId={item.iconAssetId} />
          <div><strong>{item.name}</strong><small>{item.description}</small></div>
          <button type="button" onClick={() => buy(itemId)} disabled={save.wallet.gold < price} aria-label={`Comprar ${item.name} por ${price} ouro`}>
            {price} <Coins size={13} />
          </button>
        </article>
      })}
    </div>
  </section>
}

export function DaerynServices({ save }: { save: GameSave }) {
  const prepare = useGameStore((state) => state.preparePlayerHome)
  const aid = useGameStore((state) => state.receiveDaerynAid)
  const progress = save.quests.main_terran_first_home
  return <div className="terran-drawer__section">
    <h3><HeartPulse size={18} /> Cura e alojamento</h3>
    {save.vitals.hp === 0 && <button type="button" className="terran-service-action" onClick={aid}>Receber socorro emergencial gratuito</button>}
    {progress?.status === 'active' && <button type="button" className="terran-service-action" onClick={prepare}>
      {progress.objectives.prepare_room ? <Check size={17} /> : <BedDouble size={17} />}
      {progress.objectives.prepare_room ? 'Quarto preparado · entregar a Daeryn' : 'Preparar o alojamento'}
    </button>}
    <SylwenShop save={save} />
  </div>
}

export function VorrenBestiary({ save }: { save: GameSave }) {
  const unlocked = save.world.worldFlags.includes('bestiary_unlocked')
  const identified = new Set(Object.values(content.encounters)
    .filter((encounter) => save.world.completedEncounterIds.includes(encounter.id))
    .flatMap((encounter) => encounter.enemyDefinitionIds))
  return <section className="terran-shop" aria-label="Bestiário de Vorren">
    <h3>Bestiário</h3>
    {!unlocked ? <p>Livro de campo fechado. Conclua “O Livro das Criaturas” com Vorren.</p>
      : <div className="terran-shop__stock">
        {Object.values(content.enemies).filter((enemy) => identified.has(enemy.id)).map((enemy) => <article key={enemy.id}>
          <AssetImage assetId={enemy.assetId} />
          <div><strong>{enemy.name}</strong><small>Nível {enemy.level} · Suscetível a: {enemy.weaknessTags.join(', ') || 'Não catalogado'}</small></div>
        </article>)}
        {identified.size === 0 && <p>Nenhuma criatura registrada em combate. Continue explorando Astravél.</p>}
      </div>}
  </section>
}

export function QuestNpcPanel({ save, questId, onClose }: { save: GameSave; questId: string; onClose: () => void }) {
  const offer = useGameStore((state) => state.offerQuest)
  const accept = useGameStore((state) => state.acceptQuest)
  const decline = useGameStore((state) => state.declineQuest)
  const complete = useGameStore((state) => state.turnInQuest)
  const perform = useGameStore((state) => state.performTerranQuestTask)
  const definition = content.quests[questId]
  const progress = save.quests[questId]
  if (!definition || !progress) return null
  const npc = content.npcs[definition.giverNpcId]
  return <DialogueWindow save={save} title={npc.name} portraitAssetId={npc.portraitAssetId} lines={npc.dialogue} onClose={onClose}><section className="terran-drawer__section terran-quest-dialog" aria-label={`Conversa com ${npc.name}`}>
    <button type="button" onClick={onClose}>← Voltar ao local</button>
    <div className="terran-quest-dialog__npc"><AssetImage assetId={npc.portraitAssetId} /><div><strong>{npc.name}</strong><small>{npc.title}</small></div></div>
    <p>{npc.dialogue[0]}</p>
    <h3>{definition.title}</h3>
    <p>{definition.summary}</p>
    {definition.objectives.map((objective) => <p key={objective.id}>{objective.label} · {progress.objectives[objective.id] ?? 0}/{objective.required}</p>)}
    <p>{definition.rewards.map((reward) => `${reward.type === 'gold' ? 'Ouro' : reward.type === 'characterXp' ? 'XP' : 'Essência'} +${reward.value}`).join(' · ')}</p>
    {progress.status === 'available' && <button type="button" className="terran-service-action" onClick={() => offer(questId)}>Ouvir a oferta</button>}
    {progress.status === 'offered' && <div className="terran-quest-dialog__actions">
      <button type="button" onClick={() => { decline(questId); onClose() }}>Agora não</button>
      <button type="button" onClick={() => { accept(questId); onClose() }}>Aceitar missão</button>
    </div>}
    {progress.status === 'ready_to_turn_in' && <button type="button" className="terran-service-action" onClick={() => { complete(questId, definition.turnInNpcId); onClose() }}><Check size={17} /> Entregar missão</button>}
    {progress.status === 'active' && (definition.category === 'main' && definition.objectives.some((objective) => objective.type === 'interact')
      ? <button type="button" className="terran-service-action" onClick={() => perform(questId)}>Realizar objetivo no local</button>
      : <p>Missão em andamento. Realize o objetivo antes da entrega.</p>)}
  </section></DialogueWindow>
}
