import { useState } from 'react'
import { CheckCircle2, RotateCcw, Search } from 'lucide-react'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { isQuestObjectActivityId, questObjectActivities } from '../../domain/terran/questActivities'
import { useGameStore } from '../../state/gameStore'
import { Modal } from '../components/Modal'
import { AssetImage } from '../components/AssetImage'
import './questObjectPuzzle.css'

type Option = { id: string; title: string; text: string }
type Stage = { prompt: string; guidance: string }
type Kind = (typeof questObjectActivities)[keyof typeof questObjectActivities]['kind']

const options: Record<Kind, Option[]> = {
  potions: [
    { id: 'consumable_antidote', title: content.items.consumable_antidote.name, text: content.items.consumable_antidote.description },
    { id: 'consumable_minor_tonic', title: content.items.consumable_minor_tonic.name, text: content.items.consumable_minor_tonic.description },
    { id: 'consumable_simple_ether', title: content.items.consumable_simple_ether.name, text: content.items.consumable_simple_ether.description },
  ],
  bookshelf: [
    { id: 'book_fieldcare', title: 'Notas de Campo', text: 'O reconhecimento de uma criatura não equivale a derrotá-la. Observe, registre e leve as anotações a Vorren.' },
    { id: 'book_fungorro', title: 'Bestiário Fungorro', text: 'Registros de criaturas Fungorras observadas em Astravél. Diferencie vestígios das criaturas antes de concluir um relato.' },
    { id: 'book_history', title: 'História de Terran', text: 'Uma crônica sobre a cidade; não contém a análise pedida por Vorren.' },
    { id: 'book_traces', title: 'Rastros de Astravél', text: 'Anotações das trilhas, emboscadas e locais de passagem usadas para acompanhar o avanço da expedição.' },
    { id: 'book_bonds', title: 'Fundamentos do Vínculo', text: 'Os cinco equipamentos vinculados evoluem com o próprio Terrírian; drops não substituem esses Vínculos.' },
  ],
  inscription: [
    { id: 'record_uncertain', title: 'Registrar como indício', text: 'Os sinais são suficientes para documentar a anomalia, mas não para atribuir sua causa. Levar a hipótese para Lithwynn.' },
    { id: 'origin_astravel', title: 'Identificar a procedência', text: 'A amostra/inscrição investigada foi trazida de Astravél, conforme a missão recebida. Essa é a referência de origem.' },
    { id: 'cause_certain', title: 'Declarar a causa definitiva', text: 'Uma única marca não confirma uma origem sobrenatural específica. Esta conclusão é precipitada.' },
    { id: 'pattern_irregular', title: 'Comparar padrões', text: 'Examinar as alterações da inscrição antes de concluir qualquer interpretação sobre sua origem.' },
  ],
  echo: [
    { id: 'echo_class', title: 'Classe', text: 'Disciplina desenvolvida durante a experiência no Clã. Não é selecionada na criação do personagem.' },
    { id: 'echo_npc', title: 'Escolher um NPC histórico', text: 'NPCs pertencem ao mundo, não são personagens selecionáveis na criação.' },
    { id: 'echo_character', title: 'Personagem', text: 'O Terrírian começa sem Clã e sem Classe; seu progresso é o centro do jogo.' },
    { id: 'echo_clan', title: 'Clã', text: 'A filiação é conquistada por interações, missões, NPCs e provas no mundo.' },
  ],
}

const stages: Record<Kind, Stage[]> = {
  potions: [
    { prompt: '1 · Prateleira de Vida', guidance: 'Qual frasco recupera Vida em combate?' },
    { prompt: '2 · Prateleira de Mana', guidance: 'Qual infusão recupera Mana em combate?' },
    { prompt: '3 · Prateleira de Emergência', guidance: 'Qual preparado neutraliza efeitos prejudiciais?' },
  ],
  bookshelf: [
    { prompt: '1 · Identificar o objeto de estudo', guidance: 'Encontre o livro que descreve as criaturas Fungorras.' },
    { prompt: '2 · Localizar os vestígios', guidance: 'Encontre o volume sobre rastros e rotas de Astravél.' },
    { prompt: '3 · Formalizar a observação', guidance: 'Escolha o livro com orientações de registro em campo.' },
  ],
  inscription: [
    { prompt: '1 · Procedência', guidance: 'Antes de interpretar, identifique de onde veio a inscrição.' },
    { prompt: '2 · Observação', guidance: 'Qual é a próxima etapa de uma análise cuidadosa?' },
    { prompt: '3 · Conclusão', guidance: 'O que é possível registrar sem inventar uma causa?' },
  ],
  echo: [
    { prompt: '1 · O Nexo', guidance: 'Qual elemento nasce primeiro na criação do jogo?' },
    { prompt: '2 · A Filiação', guidance: 'O que o Terrírian conquista ao longo da jornada?' },
    { prompt: '3 · A Disciplina', guidance: 'O que se desenvolve dentro de um Clã?' },
  ],
}

/** Object-first microgames: read/inspect, choose, confirm and register. UI is not
 * authoritative; the store/domain validates quest, furniture and exact solution.
 */
export function QuestObjectPuzzle({ save, questId, onClose }: {
  save: GameSave; questId: string; onClose: () => void
}) {
  const finish = useGameStore((state) => state.performTerranQuestTask)
  const [steps, setSteps] = useState<string[]>([])
  const [selection, setSelection] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  if (!isQuestObjectActivityId(questId)) return null
  const activity = questObjectActivities[questId]
  const progress = save.quests[questId]
  const active = progress?.status === 'active'
  const complete = steps.length === activity.solution.length
  const choices = options[activity.kind]
  const current = stages[activity.kind][steps.length]
  const selected = choices.find((item) => item.id === selection)

  const confirm = () => {
    if (!selection || complete) return
    if (selection !== activity.solution[steps.length]) {
      setFeedback('Este registro não corresponde ao objetivo. Releia a descrição e tente outra opção.')
      return
    }
    setSteps((currentSteps) => [...currentSteps, selection])
    setSelection(null)
    setFeedback('Etapa registrada. Continue examinando o próximo elemento.')
  }
  const register = () => {
    if (!active || !complete) return
    finish(questId, activity.objectId, steps)
    onClose()
  }

  return <Modal open title={activity.title} eyebrow="TERRAN · INTERAÇÃO DE OBJETO"
    onClose={onClose} className="quest-activity-modal"
    footer={<div className="quest-activity__footer">
      <button type="button" onClick={onClose}>Voltar à sala</button>
      {complete
        ? <button type="button" className="quest-activity__primary" disabled={!active} onClick={register}>
            <CheckCircle2 size={16} /> {active ? 'Registrar objetivo' : 'Ative a missão para registrar'}
          </button>
        : <button type="button" className="quest-activity__primary" disabled={!selection} onClick={confirm}>
            Confirmar {activity.kind === 'bookshelf' ? 'leitura' : activity.kind === 'potions' ? 'posição' : 'análise'}
          </button>}
    </div>}>
    <section className="quest-activity" aria-label={activity.title}>
      <p className="quest-activity__intro">{activity.kind === 'potions'
        ? 'Tutorial de Sylwen: organize os frascos nas prateleiras corretas. Você não consome nem recebe poções nesta atividade.'
        : activity.kind === 'bookshelf'
          ? 'Examine as lombadas e abra os volumes. As anotações de Vorren precisam ser consultadas em uma ordem de pesquisa.'
          : activity.kind === 'inscription'
            ? 'A análise organiza indícios de Astravél. Registrar uma hipótese não determina a causa definitiva da marca.'
            : 'Relacione os princípios do Nexo. Interpretar os ecos não escolhe Clã ou Classe automaticamente.'}</p>
      {!active && <p className="quest-activity__notice">{progress?.status === 'ready_to_turn_in' || progress?.status === 'completed'
        ? 'A pesquisa desta missão já foi registrada. É possível rever os materiais sem ganhar recompensa novamente.'
        : 'Este objeto pode ser estudado. Para concluir a atividade como missão, primeiro aceite a tarefa com o NPC.'}</p>}
      <div className="quest-activity__track" aria-label="Etapas do minigame">
        {activity.solution.map((_, index) => <span key={index} className={index < steps.length ? 'done' : index === steps.length ? 'current' : ''}>
          {index < steps.length ? '✓' : index + 1}
        </span>)}
        <small>{steps.length}/{activity.solution.length} etapas</small>
        {steps.length > 0 && <button type="button" onClick={() => { setSteps([]); setSelection(null); setFeedback('') }}
          aria-label="Reiniciar investigação"><RotateCcw size={13} /> Reiniciar</button>}
      </div>
      <h3>{complete ? 'Pesquisa concluída' : current.prompt}</h3>
      <p>{complete ? 'As etapas foram resolvidas. Registre o resultado para avançar a missão ativa.' : current.guidance}</p>
      <div className={'quest-activity__options quest-activity__options--' + activity.kind}
        role="group" aria-label={activity.kind === 'bookshelf' ? 'Mosaico de livros' : 'Elementos para analisar'}>
        {choices.map((item, index) => <button type="button" key={item.id} aria-pressed={selection === item.id}
          className={'quest-activity__option ' + (selection === item.id ? 'is-selected' : '')}
          data-item-id={item.id} onClick={() => { setSelection(item.id); setFeedback('') }}>
          {activity.kind === 'bookshelf'
            ? <span className="quest-activity__spine" data-spine={index % 4}><span>{item.title}</span></span>
            : activity.kind === 'potions'
              ? <AssetImage assetId={content.items[item.id]?.iconAssetId ?? 'item.simple-ether'} alt="" />
              : <span className="quest-activity__glyph" aria-hidden="true">{['◇', '✧', '⌁', 'ᛟ'][index]}</span>}
          {activity.kind !== 'bookshelf' && <span>{item.title}</span>}
        </button>)}
      </div>
      {selected && <article className="quest-activity__reading" aria-live="polite">
        <strong><Search size={14} /> {activity.kind === 'bookshelf' ? 'Página aberta' : 'Descrição'} · {selected.title}</strong>
        <p>{selected.text}</p>
      </article>}
      {feedback && <p className="quest-activity__feedback" role="status">{feedback}</p>}
      {activity.kind === 'inscription' && <small className="quest-activity__hypothesis">Hipótese investigativa. A origem definitiva da marca continua não determinada (OWNER_DECISION).</small>}
      {activity.kind === 'bookshelf' && <small>Livro selecionado: examine a página e confirme a leitura correspondente à etapa.</small>}
    </section>
  </Modal>
}
