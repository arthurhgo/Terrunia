import type { GameSave } from '../game/types'

export type CutsceneId = 'terran_arrival' | 'astravel_call' | 'ruins_threshold' | 'fungal_descent' | 'colossus_aftermath' | 'clan_oath' | 'class_awakening' | 'home_claimed'
export type Cutscene = {
  id: CutsceneId
  title: string
  tone: 'arrival' | 'portal' | 'ruins' | 'victory' | 'clan' | 'class'
  lines: readonly string[]
}

/** VISUAL_DRAFT: presentation beats; campaign facts come only from GameSave. */
export const cutscenes: readonly Cutscene[] = [
  { id: 'terran_arrival', title: 'TERRAN · O PRIMEIRO PASSO', tone: 'arrival', lines: [
    'As pedras de Terran guardam mais histórias do que seus caminhos revelam.',
    'Sete lugares cercam a Praça do Portal. Cada encontro pode alterar seu destino.',
    'Caminhe, aproxime-se dos moradores e descubra sua própria jornada.',
  ] },
  { id: 'home_claimed', title: 'TERRAN · UM LUGAR PARA VOLTAR', tone: 'arrival', lines: [
    'Daeryn entrega a chave do pequeno quarto preparado por suas mãos.',
    'A cama é simples; ainda assim, o descanso ali devolve Vida e Mana depois das expedições.',
    'O mundo continua além da porta. Agora existe um lugar ao qual regressar.',
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
  { id: 'fungal_descent', title: 'CÂMARAS FÚNGICAS · A DESCIDA', tone: 'ruins', lines: [
    'A pedra cede à matéria viva. Sob Astravél, o silêncio tem o ritmo de milhares de esporos.',
    'As câmaras se conectam por galerias tomadas de raízes. Cada passagem revela parte da anomalia.',
    'No núcleo profundo, alguma coisa antiga aguarda — e o Vínculo responde à sua presença.',
  ] },
  { id: 'colossus_aftermath', title: 'RESQUÍCIOS · MEMÓRIA DA VITÓRIA', tone: 'victory', lines: [
    'O Colosso Micélio caiu. A floresta ainda carrega seus vestígios.',
    'O Vínculo guardou a memória desse confronto.',
    'Volte a Terran para continuar sua evolução.',
  ] },
  { id: 'clan_oath', title: 'TERRAN · O JURAMENTO', tone: 'clan', lines: [
    'Três provas não bastam para definir uma vida. Elas revelam a escolha que você conquistou.',
    'No Salão dos Clãs, o rito reconhece seu compromisso. O mundo verá suas decisões através desse Vínculo.',
    'A identidade de seu Terrírian agora carrega um juramento, mas sua jornada continua sendo sua.',
  ] },
  { id: 'class_awakening', title: 'TERRAN · O CAMINHO ASSUMIDO', tone: 'class', lines: [
    'O conhecimento e as provas de sua Classe deixam de ser promessa.',
    'Uma nova maneira de agir ganha forma, sem apagar suas memórias, seus cinco Vínculos ou o Clã conquistado.',
    'Sua história seguirá pelos caminhos que escolher trilhar.',
  ] },
]

const seen = (save: GameSave, id: CutsceneId) => save.eventLog.includes(`CutsceneViewed:${id}`)

export const getNextCutscene = (save: GameSave): Cutscene | null => {
  // The social achievements are independent, explicit campaign milestones.
  // They do not confer the Clan or Class; they only present what the save already earned.
  const socialId: CutsceneId | null = save.character.clan.clanId && !seen(save, 'clan_oath')
    ? 'clan_oath'
    : save.character.classProgression.classId && !seen(save, 'class_awakening') ? 'class_awakening' : null
  if (socialId) return cutscenes.find((scene) => scene.id === socialId) ?? null
  if (save.world.worldFlags.includes('player_home_unlocked') && !seen(save, 'home_claimed')) {
    return cutscenes.find((scene) => scene.id === 'home_claimed') ?? null
  }
  const quest = save.quests.vs_astravel_first_contact?.status
  const id: CutsceneId | null = save.world.worldFlags.includes('colossus_mycelium_defeated')
    ? 'colossus_aftermath'
    : save.world.worldFlags.includes('dungeon_fungal_entered')
      ? 'fungal_descent'
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
