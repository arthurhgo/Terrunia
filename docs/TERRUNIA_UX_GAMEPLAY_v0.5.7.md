# Terrúnia v0.5.7 — Combate auditável, progressão e experiência do player

Status: **PR #56 em revisão**. Não considerar publicado até `main` integrada, CI verde e Vercel READY.

## Fonte de autoridade
`TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`. Este lote não atribui Pontos de Essência por kills ou level ups. Clã/Classe continuam conquistados no gameplay, cinco vínculos são permanentes e o combate segue uma máquina de estados.

## Feedback real recebido
1. Jogador rolou d6 face 6 com +2 de Poder contra 1 de Armadura, mas sofreu dano calculado sem usar a face — motor anterior rolava dado **apenas visual**.
2. Não havia Voltar depois de selecionar o golpe.
3. A ficha não estava acessível na Floresta de Astravél; poções só eram utilizáveis no combate.
4. Ataque básico e skill apareciam ambos como d6, sem uma distinção intuitiva.
5. Defender não justificava o turno; XP e acesso a evolução demoravam.
6. Terran tinha cabeçalhos redundantes que cortavam canvas; armas desproporcionais e armaduras como ícones soltos sobre o player.

## Implementação técnica
- Dano = `max(0, face real + Poder efetivo + bônus da habilidade - mitigação - bônus de guarda)`.
- Exemplo `d6(6) + Poder 2 + Skill 0 - Armadura 1 - Guarda 0 = 7`.
- O mesmo `roll.face` usado na animação é armazenado com `damageBreakdown` no save e no log. Dados pseudoaleatórios seguem determinísticos por seed.
- Skill usa o próximo tier de dado (máximo d12); bônus da skill e custo de MP são explicitamente mostrados antes do lançamento.
- Cooldown de `2` rodadas completas por skill, parametrizado. Não há consumo ao tentar habilidade em cooldown.
- Defender adiciona até `4` de redução a **cada** golpe recebido durante a janela, inclusive bloqueio completo de dano zero, até o player escolher sua próxima ação.
- Antes de arrastar/soltar o dado, botão `VOLTAR · ALTERAR GOLPE` descarta só o preview UI, nunca gasta Mana, vida, item, turno ou RNG persistido.
- Na Floresta: abas `Ficha` (NexusOverview), `Poções` (restauração de HP/MP no campo), `Mochila`, `Missões`, `Trilha`.
- Poções no campo: operação de domínio atômica, restaura dentro dos máximos, desconta quantidade, não permite usar efeito ofensivo nem no combate, preserva save.
- XP em dobro nos prêmios de missão/vitória, aplicado **na coleta**, sem multiplicar XP antigo e sem pontuar Essência diretamente.
- Conversão voluntária de materiais rendendo 1,5× de Essência Bruta (aplicada à barra, com overflow), refletida no UI do inventário.
- Cabeçalhos redundantes removidos da área jogável de Terran/Astravél; localização, região e descobertas disponíveis dentro de `/menu`.
- CSS da viewport ajustado para preservar um palco 384:256 entre os painéis e em resoluções variadas.
- Armas vinculadas com tamanho máximo de 16px, reduzidas em proporção ao personagem 32px.
- Armadura deixa de ser desenhada como ícone: paleta de traje derivada da própria imagem do item por pixels opacos e convertida em cores de `outfitPrimary/Secondary`, nos mesmos renderizadores de criação/cidade/casas/batalha/cutscenes. Em asset ilegível mantém as cores anteriores (fallback).
- Todo visual é cosmético, sem ligação a atributos, dano, defesa ou regras de equipamento.

## Valores provisórios — BALANCE_DRAFT, não canon definitivo
- `defendMitigation = 4`
- `skillCooldownRounds = 2`
- `skillDieStepsBonus = 1`
- `characterXpRewardMultiplier = 2`
- `essenceConversionMultiplier = 1.5`

Esses números são **OWNER_DECISION**: calibrar após playtest, especialmente encontros em grupo, dano recebido pelos players, ciclos de cooldown, velocidade de nível e ponto de Essência.

## QA obrigatório
- Dano reproduz exatamente d6(6)+2-1=7; guarda pode resultar em 0; dano sempre corresponde à face exibida.
- Skill é diferente do autoataque (dado +1 tier, bônus, MP, cooldown); cooldown não gasta ação nem Mana.
- Cancelamento antes do lançamento não altera estado da batalha; retorno de seleção funciona.
- Em Astravél, abrir Ficha, usar poção e confirmar HP/MP/inventário atualizados após reload.
- Vista 1360×768, 1024×768, 720×1280, 360×780 sem recorte da área jogável.
- Dados de localização retirados do palco e exibidos no Menu.
- Arma da altura correta, armadura integrada por cor; equipamento com asset faltante não quebra.
- Saves de batalha v0.5.6 sem `skillReadyRound` nem `damageBreakdown` continuam válidos.
- CI: TypeScript, testes Vitest, lint, build. Publicar só após validação verde.
