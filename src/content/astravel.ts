import type { EncounterDefinition, TrailNodeDefinition } from './types'
import { enemyDefinitions } from './enemies'

/** Creator-approved scope: 15 combat nodes. Names/topography and numbers remain editable drafts. */
export const ASTRAVEL_SECTORS = [
  { id: 'border', name: 'Borda Luminescente', from: 1, to: 5, color: '#83c7a4', questId: 'vs_astravel_first_contact' },
  { id: 'spores', name: 'Território dos Esporos', from: 6, to: 10, color: '#c49aca', questId: 'main_astravel_lost_hunters' },
  { id: 'roots', name: 'Raízes da Ruína', from: 11, to: 15, color: '#dbaa75', questId: 'main_astravel_corruption' },
] as const

export const getAstravelSector = (index: number) => ASTRAVEL_SECTORS.find((sector) => index <= sector.to) ?? ASTRAVEL_SECTORS[2]

type Stage = {
  id: string; label: string; x: number; y: number; enemies: string[]
  description: string; tacticalHint: string
  encounterId?: string; supplies?: string[]; flags?: string[]; checkpoint?: boolean
  fieldRecovery?: { hp: number; mp: number }
}
const stages: Stage[] = [
  { id: 'astravel_fungorro_01', label: 'Presença Fungorra', x: 24, y: 13, encounterId: 'encounter_fungorro_01',
    enemies: ['enemy_fungorro_crawler'], description: 'Esporos nas raízes denunciam o primeiro avanço da colônia. Eldamar precisa de uma prova do despertar.',
    tacticalHint: 'Aprenda a alternar ataque e defesa. O Núcleo Fúngico pode financiar sua primeira evolução.' },
  { id: 'astravel_luminous_02', label: 'Clareira Luminescente', x: 44, y: 12,
    enemies: ['enemy_luminous_slime', 'enemy_luminous_slime'], supplies: ['consumable_minor_tonic'],
    description: 'Dois limuscos ocupam uma clareira. Entre as raízes há um tônico deixado pelos viajantes.',
    tacticalHint: 'Concentre os ataques em um alvo para reduzir a quantidade de ações inimigas.' },
  { id: 'astravel_moth_03', label: 'Travessia das Mariposas', x: 64, y: 14,
    enemies: ['enemy_void_moth', 'enemy_fungorro_crawler'], supplies: ['consumable_simple_ether'],
    description: 'O pó das asas cobre a travessia. Fungorros avançam sob a proteção das mariposas.',
    tacticalHint: 'Experimente a habilidade da arma. O Éter Simples recupera Mana durante o combate.' },
  { id: 'astravel_spore_bank_04', label: 'Margem dos Esporos', x: 84, y: 18,
    enemies: ['enemy_spore_sower', 'enemy_fungal_slime'], supplies: ['consumable_antidote'],
    description: 'A margem do riacho concentra esporos nocivos. Um semeador prepara a área para a colônia.',
    tacticalHint: 'O Semeador aplica veneno. Antídotos removem efeitos nocivos; elimine a fonte primeiro.' },
  { id: 'astravel_camp_03', label: 'Acampamento Abandonado', x: 83, y: 33, checkpoint: true,
    enemies: ['enemy_spore_mantis', 'enemy_luminous_slime'], supplies: ['consumable_minor_tonic', 'consumable_resonance_flask'],
    flags: ['astravel_camp_supplies_found', 'astravel_border_secured'], fieldRecovery: { hp: 10, mp: 6 },
    description: 'Criaturas ocuparam o abrigo dos caçadores. Vencê-las libera os suprimentos e um breve repouso.',
    tacticalHint: 'Marco de apoio: a primeira vitória recupera 10 PV e 6 PM. Retorne a Terran para falar com Vorren.' },
  { id: 'astravel_hunter_tracks_06', label: 'Rastros dos Caçadores', x: 63, y: 35,
    enemies: ['enemy_spore_mantis', 'enemy_void_moth'], supplies: ['quest_hunter_insignia'],
    description: 'Um emblema do grupo de Vorren está preso às raízes. O caminho só pode ser investigado depois de aceitar a busca.',
    tacticalHint: 'Registre o primeiro vestígio. A busca de Vorren conecta os cinco encontros deste trecho.' },
  { id: 'astravel_spore_garden_07', label: 'Jardim Contaminado', x: 43, y: 34,
    enemies: ['enemy_spore_sower', 'enemy_fungal_slime', 'enemy_void_moth'], supplies: ['consumable_antidote'],
    description: 'As marcas de botas desaparecem sob uma colônia de fungos. Três criaturas bloqueiam a passagem.',
    tacticalHint: 'Reduza o grupo rapidamente. Guarde a cura para sobreviver aos turnos com vários inimigos.' },
  { id: 'astravel_spore_ambush_04', label: 'Emboscada de Esporos', x: 23, y: 35, encounterId: 'encounter_spore_ambush_01',
    enemies: ['enemy_fungorro_crawler', 'enemy_spore_sower', 'enemy_fungorro_crawler'],
    description: 'A trilha termina em uma emboscada organizada. Os vestígios confirmam o caminho seguido pelos caçadores.',
    tacticalHint: 'Priorize o Semeador e use os arremessáveis recuperados no acampamento.' },
  { id: 'astravel_horror_09', label: 'Brejo Esporulante', x: 12, y: 49,
    enemies: ['enemy_fungal_horror', 'enemy_fungal_slime'], supplies: ['consumable_vital_essence'],
    description: 'O terreno cede sob uma camada de micélio. Um Horror Esporulante vigia a saída do brejo.',
    tacticalHint: 'A Fratura Ressonante reduz mitigação. Use suas habilidades contra o Horror.' },
  { id: 'astravel_hunter_refuge_10', label: 'Refúgio dos Caçadores', x: 28, y: 58, checkpoint: true,
    enemies: ['enemy_spore_mantis', 'enemy_fungal_horror'], supplies: ['consumable_minor_tonic', 'consumable_field_rune'],
    flags: ['astravel_hunters_route_secured'], fieldRecovery: { hp: 12, mp: 8 },
    description: 'O último vestígio do grupo está num refúgio tomado pela praga. Vorren precisa receber o relato antes da descida.',
    tacticalHint: 'A primeira vitória recupera 12 PV e 8 PM. Entregue a busca a Vorren e procure Lithwynn no Mercado.' },
  { id: 'astravel_ruin_watch_11', label: 'Vigília das Ruínas', x: 48, y: 59,
    enemies: ['enemy_ruin_sentinel', 'enemy_void_moth'], supplies: ['consumable_simple_ether'],
    description: 'Runas antigas absorvem a corrupção da floresta. Lithwynn orienta a leitura das marcas da sentinela.',
    tacticalHint: 'Habilidades que causam Fratura ajudam a vencer a defesa da Sentinela.' },
  { id: 'astravel_mycelial_12', label: 'Galeria de Micélio', x: 68, y: 59,
    enemies: ['enemy_fungal_horror', 'enemy_spore_sower', 'enemy_fungal_slime'], supplies: ['consumable_antidote', 'consumable_minor_tonic'],
    description: 'Filamentos conectam árvores e ruínas a um único núcleo. A amostra precisa ser preservada para a investigação.',
    tacticalHint: 'Entre com Vida e Mana preparadas. Use a Runa de Guarda para resistir à pressão do grupo.' },
  { id: 'astravel_blackroot_13', label: 'Guardião Raiz-Negra', x: 84, y: 68,
    enemies: ['enemy_blackroot_titan', 'enemy_spore_sower'], supplies: ['consumable_vital_essence'],
    description: 'O Titan Raiz-Negra arranca suas raízes do solo. Ele protege a ligação entre o micélio e a Ruína.',
    tacticalHint: 'Minichefe: elimine o Semeador antes de concentrar seus recursos no Titan.' },
  { id: 'astravel_ruin_threshold_05', label: 'Limiar da Ruína', x: 65, y: 82,
    enemies: ['enemy_ruin_sentinel', 'enemy_fungal_horror'], supplies: ['consumable_minor_tonic', 'consumable_simple_ether'],
    flags: ['fungal_chambers_threshold_discovered'],
    description: 'Uma sentinela e um Horror protegem as inscrições quebradas. A passagem para as Câmaras só abre após a vitória.',
    tacticalHint: 'Última defesa externa. Prepare os suprimentos antes de avançar ao Núcleo das Câmaras Fúngicas.' },
  { id: 'astravel_boss_preview', label: 'Câmaras Fúngicas', x: 38, y: 86, encounterId: 'encounter_colossus_mycelium_01',
    enemies: ['enemy_colossus_mycelium'],
    description: 'O Colosso Micélio concentra a anomalia fúngica. Atravesse as salas da Ruína e alcance seu núcleo.',
    tacticalHint: 'Chefe da rota. O Fragmento Micelial e a Esmeralda são preservados para os ritos dos seus Vínculos.' },
]

export const astravelCombatNodes: TrailNodeDefinition[] = stages.map((stage, i) => ({
  id: stage.id, index: i + 1, type: i === 14 ? 'boss' : 'battle', label: stage.label,
  encounterId: stage.encounterId ?? `encounter_${stage.id}`, actionLabel: `Enfrentar ${stage.label}`,
  position: { x: stage.x, y: stage.y }, description: stage.description, tacticalHint: stage.tacticalHint,
  sectorId: getAstravelSector(i + 1).id, recommendedLevel: 1 + Math.floor(i / 5), checkpoint: stage.checkpoint,
  // One gate per sector: acceptance remains explicit, never automatic.
  requiresQuestId: i === 0 ? 'vs_astravel_first_contact' : i >= 10 ? 'main_astravel_corruption' : i >= 5 ? 'main_astravel_lost_hunters' : undefined,
}))

const enemyById = Object.fromEntries(enemyDefinitions.map((enemy) => [enemy.id, enemy]))
/** Every defeated species contributes its own guaranteed material. No equipment replacement. */
export const astravelEncounterDefinitions: EncounterDefinition[] = stages.map((stage, index) => {
  const enemies = stage.enemies.map((id) => enemyById[id])
  const first = index === 0, boss = index === 14
  return {
    id: stage.encounterId ?? `encounter_${stage.id}`, name: boss ? 'Colosso Micélio' : first ? 'Primeira Presença Fungorra' : stage.label, trailNodeId: stage.id,
    locationLabel: boss ? 'Câmaras Fúngicas de Astravél' : getAstravelSector(index + 1).name,
    enemyDefinitionIds: stage.enemies, canFlee: false,
    victoryTitle: boss ? 'O núcleo da Ruína cedeu' : stage.checkpoint ? 'Refúgio recuperado' : 'A rota foi preservada',
    victorySummary: boss ? 'A memória do Colosso foi gravada no Vínculo. Retorne a Lithwynn com o relato da Ruína.'
      : stage.checkpoint ? `${stage.description} O repouso e os suprimentos são concedidos uma única vez.`
        : `Marco ${index + 1}/15 preservado. ${stage.description}`,
    rewards: {
      characterXp: enemies.reduce((sum, enemy) => sum + enemy.xpReward, 0),
      gold: enemies.reduce((sum, enemy) => sum + enemy.goldReward, 0),
      boundResonance: enemies.reduce((sum, enemy) => sum + enemy.boundResonanceReward, 0),
      lootDefinitionIds: [...enemies.flatMap((enemy) => enemy.lootDefinitionIds), ...(stage.supplies ?? [])],
      ...(stage.fieldRecovery ? { fieldRecovery: stage.fieldRecovery } : {}),
      worldFlags: [...(stage.flags ?? []), ...(boss ? ['colossus_mycelium_defeated', 'fungal_chambers_first_clear', 'astravel_route_cleared'] : [])],
      ...(first ? { characterXp: 15, gold: 8, boundResonance: 12 } : {}),
      ...(boss ? { boundMemory: { type: 'boss' as const, sourceId: 'enemy_colossus_mycelium',
        title: 'Memória do Colosso Micélio', description: 'O primeiro núcleo de uma Ruína derrotado ao lado do Vínculo.' } } : {}),
    },
    status: 'BALANCE_DRAFT',
  }
})
