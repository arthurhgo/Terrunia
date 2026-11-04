import { BookOpen, ScrollText, Shield, Sword } from 'lucide-react'
import { useState } from 'react'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { BOUND_SLOTS, BOUND_SLOT_LABELS } from '../../domain/shared/types'
import { EquipmentCatalog } from '../dashboard/EquipmentCatalog'
import './eldamarBookshelf.css'

type RecordTab = 'manual' | 'arsenal' | 'foundations'

const pages: Array<{ id: RecordTab; label: string }> = [
  { id: 'manual', label: 'Guia do Viajante' },
  { id: 'arsenal', label: 'Arsenal Visual' },
  { id: 'foundations', label: 'Fundamentos dos Vínculos' },
]

const guide = [
  {
    title: 'Exploração e interações',
    content: 'Caminhe com WASD ou setas. Clique ou toque no cenário para caminhar até um destino. Aproxime-se de pessoas e móveis e pressione E para interagir. Portas levam aos interiores.',
  },
  {
    title: 'Personagem, Clã e Classe',
    content: 'Todo personagem começa como Terrírian sem Clã e sem Classe. Filiação, treinamento e novas disciplinas acontecem por missões, relações e NPCs durante o jogo.',
  },
  {
    title: 'Cinco equipamentos vinculados',
    content: 'Arma, Escudo ou Protetor Arcano, Armadura, Colar e Pulseira acompanham o personagem. Os Vínculos evoluem por Graus, Ressonância, Essências, Joias, Runas e Memórias. Drops não substituem os itens vinculados.',
  },
  {
    title: 'Essência e Skill Tree',
    content: 'A Essência recebida alimenta uma barra. Ao completá-la, gera um Ponto de Essência; o excedente permanece. A Skill Tree possui tela própria com ramos do Nexo, Clã, Classe e equipamentos vinculados.',
  },
  {
    title: 'Combate e Portal',
    content: 'O combate é por turnos. Você escolhe ações e alvos, alternando com os turnos inimigos. O Portal oferece encontros, caçadas e Modo Ondas. Recompensas são obtidas pela resolução dos combates.',
  },
  {
    title: 'Mochila, Base e descanso',
    content: 'O Inventário guarda recursos, materiais e consumíveis temporários. A Base do Terrírian é acessada pela porta no mapa. No interior, o baú armazena recursos pessoais e a cama recupera Vida e Mana.',
  },
  {
    title: 'Progresso e salvamento',
    content: 'Missões, encontros, inventário e evolução são guardados na campanha individual. O progresso existente é mantido ao retornar ao mesmo personagem. O indicador de salvamento permanece no cabeçalho.',
  },
] as const

/** Reference-only world archive; opening it never changes the character or inventory. */
export function EldamarRecords({ save }: { save: GameSave }) {
  const [tab, setTab] = useState<string>('manual')
  const selectedChapter = tab.startsWith('chapter_') ? guide[Number(tab.slice(8))] : null
  const shelfBooks = [...pages, ...guide.map((section, index) => ({ id: `chapter_${index}`, label: `Caderno ${index + 1} · ${section.title}` }))]
  return <section className="eldamar-records" aria-label="Arquivo da Estante dos Registros de Eldamar">
    <p className="eldamar-records__intro"><ScrollText size={17} aria-hidden="true" />
      Documentos de referência guardados na Casa de Eldamar. A leitura não concede equipamentos nem altera seu progresso.</p>
    <div className="eldamar-records__tabs eldamar-records__bookshelf" role="group" aria-label="Seções dos registros">
      {shelfBooks.map((page, index) => <button key={page.id} type="button"
        className={tab === page.id ? 'active' : ''} title={page.label}
        aria-pressed={tab === page.id} onClick={() => setTab(page.id)}>
        <span className="eldamar-records__spine" data-book-color={index % 5}>{page.label}</span>
      </button>)}
    </div>
    {selectedChapter && <article className="eldamar-records__selected-book" aria-label={'Livro aberto: ' + selectedChapter.title}>
      <p className="eyebrow">ESTANTE DE ELDAMAR · VOLUME ABERTO</p>
      <h3><BookOpen size={19} /> {selectedChapter.title}</h3>
      <p>{selectedChapter.content}</p>
    </article>}
    {tab === 'manual' && <div className="eldamar-records__manual">
      <h3><BookOpen size={18} aria-hidden="true" /> Manual de Terrúnia</h3>
      {guide.map((section) => <details key={section.title}>
        <summary>{section.title}</summary>
        <p>{section.content}</p>
      </details>)}
    </div>}
    {tab === 'arsenal' && <EquipmentCatalog />}
    {tab === 'foundations' && <div className="eldamar-records__foundations">
      <h3><Sword size={18} aria-hidden="true" /> Catálogo de Fundações</h3>
      <p>Registro consultivo: estas peças não podem ser equipadas pela estante. Os Vínculos são obtidos e evoluídos por gameplay.</p>
      <p><Shield size={14} aria-hidden="true" /> Vínculos ativos neste personagem: {BOUND_SLOTS.filter((slot) => save.character.bondedEquipment[slot]).length}/5</p>
      {BOUND_SLOTS.map((slot) => <details key={slot}>
        <summary>{BOUND_SLOT_LABELS[slot]}</summary>
        <div className="eldamar-records__foundation-list">
          {Object.values(content.boundItemBases)
            .filter((item) => item.slot === slot)
            .map((item) => <article key={item.id}>
              <strong>{item.name}</strong>
              <small>Rank {item.rank} · {item.archetype}</small>
              <p>{item.description}</p>
            </article>)}
        </div>
      </details>)}
    </div>}
  </section>
}
