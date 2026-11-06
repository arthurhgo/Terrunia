import { DialogueWindow } from './DialogueWindow'
import { BedDouble, Check, Coins, HeartPulse, ShoppingBasket, Archive, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { content } from '../../content/catalog'
import { QuestContextNote } from '../quests/QuestContextNote'
import { getQuestRewardPreview } from '../../domain/quests/questRewardPreview'
import { getDiscoveredEnemyIds, getDiscoveredProgressiveFauna } from '../../content/progressiveFaunaLore'
import { deriveCharacterStats } from '../../domain/character/derivedStats'
import type { GameSave } from '../../domain/game/types'
import { PLAYER_HOME_FLAG, SYLWEN_STOCK } from '../../domain/terran/services'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import { ProgressBar } from '../components/ProgressBar'
import { getNpcActionableQuests, getQuestStatusLabel } from '../../domain/quests/questSelectors'
import { getDeliverableCount } from '../../domain/quests/questInventory'
import { isQuestObjectActivityId, questObjectActivities } from '../../domain/terran/questActivities'

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
    <p>Seu refúgio particular em Terran. Depois de usar a Chave de Daeryn na porta, você pode guardar materiais no baú e recuperar Vida e Mana na cama.</p>
    <small>{prepared ? 'Daeryn entregou a chave na conclusão da missão. Ela destranca a porta da Base no primeiro uso.' : 'A Base permanece trancada até concluir a missão de Daeryn e usar a chave na porta.'}</small>
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

/** Personal archive from real save data; no invented quests or manual save slot. */
export function BaseRecords({ save }: { save: GameSave }) {
  const completed = Object.values(save.quests).filter((quest) => quest.status === 'completed')
    .map((quest) => content.quests[quest.questId]).filter(Boolean)
  const memories = Object.values(save.boundItems).flatMap((item) => item.memories.map((memory) => ({
    itemId: item.baseItemId, title: memory.title, description: memory.description,
  })))
  const fauna = getDiscoveredProgressiveFauna(save, content)
  const chapters = [
    { id: 'main', title: 'Crônica principal', entries: completed.filter((quest) => quest.category === 'main') },
    { id: 'clan', title: 'Provas de Clã', entries: completed.filter((quest) => quest.category === 'clan') },
    { id: 'class', title: 'Caminho da Classe', entries: completed.filter((quest) => quest.category === 'class') },
    { id: 'world', title: 'Relatos de Terran e Astravél', entries: completed.filter((quest) => quest.category === 'secondary' || quest.category === 'bounty') },
  ]
  return <section className="base-records" aria-label="Registros do Terrírian">
    <h3>Registros · Memórias e Crônica</h3>
    <p>{save.character.name} · Nível {save.character.level} · {completed.length} missões concluídas</p>
    <p>A crônica reúne somente fatos vividos e missões entregues. Conhecimento ainda não descoberto permanece fora do registro.</p>
    {chapters.map((chapter) => <details className="base-records__chapter" key={chapter.id} open={chapter.id === 'main'}>
      <summary>{chapter.title} · {chapter.entries.length} registro(s)</summary>
      {chapter.entries.length ? <ul>{chapter.entries.map((quest) => <li key={quest.id}>
        <strong>{quest.title}</strong><small>{quest.summary}</small>
      </li>)}</ul> : <p>Nenhum relato registrado nesta parte da jornada.</p>}
    </details>)}
    <details className="base-records__chapter" aria-label="Bestiário de campo descoberto">
      <summary>Bestiário de campo · {fauna.length} relato(s) descoberto(s)</summary>
      {fauna.length ? <ul>{fauna.map((entry) => <li key={entry.id}>
        <strong>{entry.title}</strong><small>{entry.description}</small>
      </li>)}</ul> : <p>Vença criaturas e recolha seus espólios para registrar observações.</p>}
    </details>
    <h4>Memórias dos Vínculos</h4>
    {memories.length ? <ul>{memories.slice(-20).map((memory, i) => <li key={memory.itemId + ':' + i}>
      <strong>{memory.title}</strong><small>{memory.description}</small>
    </li>)}</ul> : <p>Nenhuma memória de equipamento registrada.</p>}
    <small>O progresso é salvo automaticamente no Nexo. Registros não criam um segundo sistema de salvamento.</small>
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
  const aid = useGameStore((state) => state.receiveDaerynAid)
  const progress = save.quests.main_terran_first_home
  return <div className="terran-drawer__section">
    <h3><HeartPulse size={18} /> Cura e alojamento</h3>
    {save.vitals.hp === 0 && <button type="button" className="terran-service-action" onClick={aid}>Receber socorro emergencial gratuito</button>}
    {progress?.status === 'active' && <p className="terran-service-hint">
      {progress.objectives.prepare_room ? 'Poções organizadas. Entregue a missão para receber a chave.' : 'Tutorial: aproxime-se da Estante de Cura nesta sala e organize os três tipos de poção.'}
    </p>}
    <SylwenShop save={save} />
  </div>
}

export function VorrenBestiary({ save }: { save: GameSave }) {
  const unlocked = save.world.worldFlags.includes('bestiary_unlocked')
  const identified = getDiscoveredEnemyIds(save, content)
  const studied = new Map(getDiscoveredProgressiveFauna(save, content).map((entry) => [entry.enemyId, entry]))
  return <section className="terran-shop" aria-label="Bestiário de Vorren">
    <h3>Bestiário</h3>
    {!unlocked ? <p>Livro de campo fechado. Conclua “O Livro das Criaturas” com Vorren.</p>
      : <div className="terran-shop__stock">
        {Object.values(content.enemies).filter((enemy) => identified.has(enemy.id)).map((enemy) => <article key={enemy.id}>
          <AssetImage assetId={enemy.assetId} />
          <div><strong>{enemy.name}</strong><small>Nível {enemy.level} · Suscetível a: {enemy.weaknessTags.join(', ') || 'Não catalogado'}</small>
            {studied.has(enemy.id) && <small>{studied.get(enemy.id)?.description}</small>}</div>
        </article>)}
        {identified.size === 0 && <p>Nenhuma criatura registrada em combate. Continue explorando Astravél.</p>}
      </div>}
  </section>
}

export function QuestNpcPanel({ save, questId, onClose, onSelectQuest, embedded = false }: { save: GameSave; questId: string; onClose: () => void; onSelectQuest?: (id: string) => void; embedded?: boolean }) {
  const accept = useGameStore((state) => state.acceptQuest)
  const decline = useGameStore((state) => state.declineQuest)
  const complete = useGameStore((state) => state.turnInQuest)
  const performTrial = useGameStore((state) => state.performSocialTrial)
  const definition = content.quests[questId]
  const progress = save.quests[questId]
  if (!definition || !progress) return null
  const rewardPreview = getQuestRewardPreview(definition, content)
  const npc = content.npcs[definition.giverNpcId]
  const conversations = getNpcActionableQuests(save, npc.id, content)
  const details = <section className="terran-drawer__section terran-quest-dialog" aria-label={`Missão de ${npc.name}`}>
    {onSelectQuest && conversations.length > 1 && <nav className="npc-quest-choices" aria-label={`Missões de ${npc.name}`}>
      {(['main', 'secondary', 'other'] as const).map((group) => {
        const quests = conversations.filter((quest) => group === 'main' ? quest.category === 'main'
          : group === 'secondary' ? quest.category === 'secondary' || quest.category === 'bounty'
          : quest.category === 'clan' || quest.category === 'class')
        return quests.length > 0 && <div className={`npc-quest-group npc-quest-group--${group}`} key={group}>
          <h3>{group === 'main' ? 'Missão principal' : group === 'secondary' ? 'Secundárias' : 'Clã e Classe'}</h3>
          {quests.map((quest) => <button type="button" key={quest.id} aria-pressed={quest.id === questId} data-quest-status={save.quests[quest.id].status}
            onClick={() => onSelectQuest(quest.id)}><strong>{quest.category === 'secondary' || quest.category === 'bounty' ? '◇' : '!'} {quest.title}</strong>
            <small>{getQuestStatusLabel(save.quests[quest.id].status)}</small></button>)}
        </div>
      })}
    </nav>}
    {(!onSelectQuest || conversations.length < 2) && <h3>{definition.category === 'secondary' || definition.category === 'bounty' ? '◇ ' : ''}{definition.title}</h3>}
    {definition.objectives.map((objective) => <p key={objective.id}>{objective.label} · {progress.objectives[objective.id] ?? 0}/{objective.required}</p>)}
    <QuestContextNote note={definition.contextNote} />
    {rewardPreview.length > 0 && <div className="terran-quest-dialog__reward-list" aria-label="Recompensas da missão">
      <strong>Recompensas ao entregar</strong>
      <ul>{rewardPreview.map((reward) => <li key={reward.id}>{reward.label}</li>)}</ul>
    </div>}
    {definition.turnInItems && <div className="quest-delivery-items">
      {definition.turnInItems.map((input) => <span key={input.itemId}><AssetImage assetId={content.items[input.itemId].iconAssetId} />
        {content.items[input.itemId].name}<strong>{getDeliverableCount(save, input.itemId, content)}/{input.quantity}</strong></span>)}
      <small>Materiais na mochila (ainda não entregues).</small>
    </div>}
    {['available', 'offered'].includes(progress.status) && <div className="terran-quest-dialog__actions"
      role="group" aria-label={`Confirmar missão: ${definition.title}`}>
      <button type="button" className="terran-quest-dialog__later"
        onClick={() => { if (progress.status === 'offered') decline(questId); onClose() }}>Agora não</button>
      <button type="button" className="terran-quest-dialog__accept"
        onClick={() => accept(questId)}><Check size={16} /> Aceitar missão</button>
    </div>}
    {progress.status === 'ready_to_turn_in' && <button type="button" className="terran-service-action" onClick={() => { complete(questId, definition.turnInNpcId); onClose() }}><Check size={17} /> Entregar missão</button>}
    {progress.status === 'active' && (definition.category === 'clan' || definition.category === 'class') &&
      <button type="button" className="terran-service-action" onClick={() => performTrial(questId)}>
        Realizar prova com representante
      </button>}
    {progress.status === 'active' && isQuestObjectActivityId(questId) &&
      <p className="terran-quest-dialog__object-hint">
        <strong>Objetivo interativo:</strong> aproxime-se de <strong>{questObjectActivities[questId].title}</strong> neste local.
        Interaja com o objeto, resolva a atividade e depois retorne para entregar a missão.
      </p>}
  </section>
  return embedded ? details : <DialogueWindow save={save} title={npc.name} eyebrow={npc.title}
    portraitAssetId={npc.portraitAssetId} lines={npc.dialogue} quest={definition} onClose={onClose}>{details}</DialogueWindow>
}
