# Terrúnia v0.5.6 — Nexo equipado e feedback de interações

**Status:** PR #55 em implementação/CI; só declarar produção quando a `main` for integrada e o Vercel responder `READY`.

## Canon
Continua válida a `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`. Esta entrega não muda regras, drops, trocas de equipamentos, Clãs, Classes, stats nem saves. Os 5 vínculos continuam permanentes. A camada visual não governa combate.

## Compositor único de personagem
- `getVisualEquipment(save)` usa **somente** IDs de equipamentos realmente vinculados e a proteção simples vestida, sem criar itens e sem duplicar o slot de Armadura.
- Suporte aos cinco slots: Arma, Escudo/Protetor, Armadura, Colar, Pulseira. Peças não equipadas não aparecem.
- `getEquipmentAnchor(item, facing)` define coordenadas nativas **32×32** por direção, posição da mão e ponto de grip/rotação da arma, com empilhamento atrás do corpo ao olhar para cima.
- Canvas de mundo e React usam a mesma função: `equipmentCanvas.ts` e `CharacterComposite`/`EquippedCharacter`.
- Integrado a Terran, interiores das casas, Astravél, dungeons, cutscenes, prólogo, campo de combate e derrota.
- O visual responde ao save. Sprite, física da arma e sistemas de gameplay permanecem independentes.
- Os sprites visuais atuais de equipamento são **assets de item registrados** aplicados em camadas de visualização e não artes finais de vestimenta em poses. A substituição posterior deve priorizar sprites de vestir com fundo transparente, âncoras por item/direção e o mesmo assetRegistry. Não afirmar que houve nova arte pintada à mão.

## Login, Nexo e painéis
- Nexo à esquerda e HUD mostram o mesmo `EquippedCharacter` criado pelo jogador e os cinco equipamentos visuais.
- Tela de retorno à conta autenticada mostra o save real.
- Na tela de **login anterior à autenticação**, ainda não sabemos de qual conta será o usuário; por isso só exibimos a **última aparência cosmética deste dispositivo** quando previamente consentida pela criação/jogo. O código grava no localStorage apenas visual e IDs de assets (sem nome, uid, email, progressão, save ou credenciais). A interface explica este comportamento. Um outro dispositivo não tem esse cache.
- Fallback por assetRegistry em saves antigos ou ausentes, sem exceção de runtime.

## Feedback de missões/interações
- NPC com missão nova/aceitável: contorno discreto dourado e centelha.
- NPC com entrega pronta: verde mais intenso.
- NPC com missão ativa, bloqueada, concluída ou apenas lore: não brilha como oferta.
- Rosetta só emite brilho de oferta quando alguma missão dela está disponível/oferecida.
- Locais com moradores com missões em oferta, objetos de missão relevantes, interações de serviço/arquivo, descobertas não investigadas e drops exibem ênfase contextual e/ou hover.
- Abas de assunto do NPC com `data-quest-status` recebem brilho somente quando oferecem novo conteúdo ou entrega pronta.
- Feedback é acessível por foco/hover, com respeito a movimento reduzido; animações puramente CSS, sem duplicar lógica ou alterar save.

## Testes e QA
- Testar em mouse e touch: login (antes/depois), Nexo, personagem nos 4 sentidos da cidade e casas, cutscenes, combate e prólogo.
- Conferir a pegada da arma na mão e oclusão por direção, cinco camadas, simples vs vinculado, persistência visual após salvar/carregar.
- Garantir que somente missões reais disponíveis/entregáveis cintilem, enquanto missões ativas/concluídas não.
- Realizar lint, TypeScript, Vitest e build, então merge em `main` e confirmar aliases de produção Vercel.

## OWNER_DECISION / futuras artes
- Sprites próprios de equipamentos vestidos sobre o corpo (armaduras detalhadas, efeitos por classe, mãos e poses de combate dedicadas) ainda precisam ser **produzidos/substituídos**. Os ícones existentes servem como placeholders de camada na v0.5.6.
- O login pré-autenticação mostra um visual de dispositivo, não o personagem confirmado de uma conta ainda não identificada.
