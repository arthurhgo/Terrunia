import { content } from '../../content/catalog'
import type { TerranNpcPresence } from '../../content/types'
import type { GameSave } from '../game/types'

/** CONTENT_DRAFT: ambient lines are replaceable narrative data, not quests or canon facts. */
const cityLines: Record<string, readonly string[]> = {
  presence_torvynn: ['Os símbolos mais antigos resistem ao tempo. Às vezes, são eles que nos decifram.', 'Se trouxer um registro desconhecido, as mesas de Eldamar estarão acesas.'],
  presence_gethin: ['Toda rua de Terran guarda uma história. Prefiro as que alguém ainda pode contar.', 'As crônicas também são feitas de quem volta para casa.'],
  presence_elvira: ['Existem páginas que só aparecem quando a luz se inclina.', 'Ainda não é hora de abrir todas as gavetas.'],
  presence_vorren: ['As trilhas não começam no mato. Começam quando alguém decide olhar com atenção.', 'Antes de partir, descubra o que sabe sobre a criatura que procura.'],
  presence_elric: ['Nem todo rastro exige uma flecha. Alguns pedem distância e paciência.', 'Guarde um pouco de água para o caminho de volta.'],
  presence_draelis: ['Rotas seguras são memórias de quem já caminhou por elas.', 'A cada expedição, registre também o que mudou.'],
  presence_keldron: ['Um bom caçador nunca se apaixona pela primeira pista.', 'Ouça a floresta antes de atravessar a sombra.'],
  presence_nerion: ['Os mapas são hipóteses; o céu nunca promete ficar imóvel.', 'As distâncias são diferentes para quem conhece as estrelas.'],
  presence_lithwynn: ['Uma fissura conta duas histórias: o que se partiu e o que ainda resiste.', 'No Mercado, estudo a corrupção antes de aplicar a Infusão.'],
  presence_valmira: ['Runas exigem intenção. Um traço impreciso pode mudar todo o sentido.', 'Um Vínculo verdadeiro não é uma peça descartável.'],
  presence_talia: ['Um cristal não inventa a luz. Ele revela caminhos que ela pode seguir.', 'Joias precisam de compatibilidade, não de força bruta.'],
  presence_edran: ['Símbolos gravados com pressa costumam cobrar seu preço depois.', 'Observe a superfície antes de desenhar o primeiro sinal.'],
  presence_feril: ['A pedra guarda marcas mesmo quando esquecemos quem as deixou.', 'É melhor conhecer a estrutura antes do rito.'],
  presence_lorian: ['Uma mistura reativa pode alterar uma inscrição inteira.', 'Minha bancada é um lugar de observação, não de apostas.'],
  presence_durnan: ['Não existe metal teimoso; existe ferramenta que ainda não aprendeu.', 'O Mercado tem um som próprio quando está trabalhando.'],
  presence_zareth: ['Terran tem portas porque alguém escolheu protegê-las.', 'Disciplina é retornar ao posto mesmo quando ninguém está olhando.'],
  presence_kaedin: ['Silêncio também é informação.', 'O turno mais calmo é aquele em que não baixamos a guarda.'],
  presence_torvan: ['Um escudo só cumpre sua promessa quando há alguém atrás dele.', 'Força e responsabilidade devem avançar juntas.'],
  presence_dremor: ['Ainda verifico os mesmos pontos do muro. Cada noite conta uma história diferente.', 'Não confunda rotina com ausência de perigo.'],
  presence_mireya: ['A vigília pertence a quem permanece desperto pelo próximo.', 'A cidade precisa de coragem, mas também de prudência.'],
  presence_daeryn: ['Cuidar de quem regressa é parte da própria expedição.', 'Prepare o corpo antes de exigir dele uma vitória.'],
  presence_sylwen: ['Poções só ajudam quando o preparo é tão cuidadoso quanto a dose.', 'Nunca rotule um frasco antes de conferir seu conteúdo.'],
  presence_briana: ['As folhas respondem à estação e ao solo.', 'Se sair para colher, traga somente o que puder reconhecer.'],
  presence_orlan: ['Há plantas que crescem onde ninguém espera encontrá-las.', 'Conhecer a origem de um ingrediente evita erros.'],
  presence_portal_guardian: ['O Portal registra destinos, não desejos. A autorização vem da missão.', 'Confira seus preparativos. O retorno também faz parte da jornada.'],
}

export function getTerranDialogue(save: GameSave, presence: TerranNpcPresence): readonly string[] {
  const npc = presence.npcId ? content.npcs[presence.npcId] : null
  if (npc?.dialogue.length) return npc.dialogue
  if (save.world.worldFlags.includes('colossus_mycelium_defeated') && presence.id === 'presence_vorren') {
    return ['O Colosso Micélio caiu, mas o terreno ainda precisa ser observado.', 'Uma vitória é um novo registro, não o fim de todas as trilhas.']
  }
  if (save.world.worldFlags.includes('fungal_chambers_threshold_discovered') && presence.id === 'presence_daeryn') {
    return ['As Câmaras Fúngicas exigem atenção à respiração e aos esporos.', 'Preparação e descanso também são formas de coragem.']
  }
  return cityLines[presence.id] ?? [
    `Você me encontrará aqui: ${presence.roleLabel.toLowerCase()}.`,
    'Cada encontro revela um pouco mais das histórias de Terran.',
  ]
}
