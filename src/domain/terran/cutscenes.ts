import type { GameSave } from '../game/types'

export type CutsceneId = 'terran_arrival' | 'astravel_call' | 'ruins_threshold' | 'colossus_aftermath'
export type Cutscene = {
  id: CutsceneId
  title: string
  tone: 'arrival' | 'portal' | 'ruins' | 'victory'
  lines: readonly string[]
}

/** VISUAL_DRAFT: presentation beats; campaign facts come only from GameSave. */
export const cutscenes: readonly Cutscene[] = [
  { id: 'terran_arrival', title: 'TERRAN · O PRIMEIRO PASSO', tone: 'arrival', lines: [
    'As pedras de Terran guardam mais histórias do que seus caminhos revelam.',
    'Sete lugares cercam a Praça do Portal. Cada encontro pode alterar seu destino.',
    'Caminhe, aproxime-se dos moradores e descubra sua própria jornada.',
  ] },
  { id: 'astravel_call', title: 'ASTRAVÉL · O CHAMADO', tone: 'portal', lines: [
    'A investigação de Eldamar deixa os registros e alcança o mundo.',
    'A Praça do Portal reconhece uma rota para Astravél.',
    'A jornada começa quando você escolher atravessar.',
  ] },
  { id: 'ruins_threshold', title: 'CÂMARAS FÚNGICAS · O LIMIAR', tone: 'ruins', lines: [
    'Além dos esporos, algo antigo permanece à espreita.',
    'O caminho adiante exige preparação e decisão.',
  ] },
  { id: 'colossus_aftermath', title: 'RESQUÍCIOS · MEMÓRIA DA VITÓRIA', tone: 'victory', lines: [
    'O Colosso Micélio caiu. A floresta ainda carrega seus vestígios.',
    'O Vínculo guardou a memória desse confronto.',
    'Volte a Terran para continuar sua evolução.',
  ] },
]

const seen = (save: GameSave, id: CutsceneId) => save.eventLog.includes(`CutsceneViewed:${id}`)

export const getNextCutscene = (save: GameSave): Cutscene | null => {
  const quest = save.quests.vs_astravel_first_contact?.status
  const id: CutsceneId | null = save.world.worldFlags.includes('colossus_mycelium_defeated')
    ? 'colossus_aftermath'
    : save.world.worldFlags.includes('fungal_chambers_threshold_discovered')
      ? 'ruins_threshold'
      : quest === 'active'
        ? 'astravel_call'
        : Boolean(save.character.bondedEquipment.weapon) && (quest === 'available' || quest === 'offered')
          ? 'terran_arrival'
          : null
  // A campaign's latest milestone supersedes unviewed earlier beats.
  return id && !seen(save, id) ? cutscenes.find((scene) => scene.id === id) ?? null : null
}
