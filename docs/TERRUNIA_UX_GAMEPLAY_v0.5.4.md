# Terrúnia v0.5.4 — Criador de Terrírian e Timeline de Combate

Status: implementação proposta em PR #53; **não publicada** até validação CI, merge e deploy READY.

## Autoridade
Este documento registra somente as alterações desta versão. `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md` continua sendo a especificação técnica canônica quando não houver decisão nova expressa.

## Criação e pontos
- **Decisão do proprietário:** novo personagem recebe **6 Pontos de Atributo iniciais**. Evolução permanece d4→d6→d8→d10→d12 a **2 pontos por avanço**; nenhuma mudança silenciosa no custo.
- As **sete armas iniciais** existentes no catálogo são elegíveis por uma distribuição de até seis pontos, incluindo Machado de Guerra e Livro de Magias; requisito de nível 1.
- Botão opcional de **distribuição sugerida** refaz a distribuição ANTES do primeiro vínculo, preservando pontos e garantindo os requisitos da arma selecionada. Não vincula automaticamente.
- Clã e Classe continuam adquiridos **no jogo**, não na criação.

## Editor de sprites
- Aparência modular por dados persistidos: apresentação masculino/feminino/neutro; porte leve/médio/robusto; tom de pele; rosto; olhos; cabelo; cor; barba; traje; cores principal/secundária.
- Preview procedural 16×16 com pixels SVG crispEdges; serve como placeholder refinado e não substitui o registro manual de sprites.
- Render integrado: criação, prólogo, Terran, Astravél, Câmaras Fúngicas e combate (incluindo arma vinculada).
- Save usa `character.appearance?` opcional: jogadores anteriores continuam com portraitAssetId do `assetRegistry`. Nenhuma mecânica depende dos pixels.
- Para uso futuro, novos estilos totais de sprite com animações direcionais podem ser registrados manualmente sem alterar regras de domínio.

## Combate
- Divisória de rodada `TURNO 1`, `TURNO 2`, etc, **lida do `battle.round`** e exibida uma vez por rodada real.
- Ações bloqueadas temporariamente enquanto a apresentação da divisória estiver ativa.
- Timeline apresenta `initiativeOrder` e `battle.log` reais; indicadores de ativo, derrotado e cores distintas; histórico expandido sem modificar o estado do combate.
- Rolagem em plataforma prolongada: arremesso 1.350 ms, sequência 2.500 ms (incluindo tempo de leitura); movimento reduzido preservado.
- Dado do jogador mantém gesto `arrastar para cima e soltar`; não rola por clique isolado. Pressionar Enter/Espaço oferece alternativa de acessibilidade.
- Fórmula de dano e motor de combate não foram alterados.

## Melhorias de UX
- Visualizador em tempo real com ferramentas **Surpreender** e **Restaurar**.
- Seletores e paletas com escolha livre de cor por color picker.
- Distribuição orientada por requisitos de arma, com custo total explícito.
- Timeline responsiva e consultável sem interromper a batalha.
- Tempos de animação centralizados em `presentationTiming.ts` para reequilíbrio sem tocar no domínio.

## OWNER_DECISION / Limites
- Escolha de arma continua no **prólogo**, após confirmar a aparência e antes de entrar em Terran. Aprovação de mudança para a mesma tela é independente.
- Sexos/apresentações são parâmetros visuais sem efeitos de atributos.
- Outras categorias de rosto, cabelos, trajes, sprites direcionais/sheets e animações completas podem ser adicionadas via registry, sem alterar mecânicas.
- Dano causado pela face do dado permanece `VISUAL_DRAFT`, sujeito a regra futura expressamente aprovada.
- Dados de iniciativa individuais de monstros permanecem `BALANCE_DRAFT`.
