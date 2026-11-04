# Terrúnia v0.25 — Objetos de missão, minigames e diálogo unificado

Data: 2026-11-04. Autoridade técnica: `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`. Esta entrega acrescenta gameplay à vertical slice de Terran, sem alterar a economia, o esquema de save v17, o Vínculo permanente, recompensas ou regras de Clã/Classe.

## 1. Cama na Base do Terrírian
No interior, o botão de serviço antes chamado **Casa** agora mostra **Cama** com subtítulo `descansar e recuperar`, em tamanho menor e itálico. O botão atua sobre a mesma cama e a ação existente de `restAtHome`, recuperando Vida/Mana pelas estatísticas reais somente quando a Base está acessível. O baú e a mesa permanecem móveis separados; a porta segue exigindo o primeiro uso legítimo da Chave de Daeryn.

## 2. NPCs — primeiro missão, depois conversa
Quando um NPC possui missão acionável, uma única `NpcMissionHub` apresenta a lista de missões antes da conversa, com título/status e seleção de uma missão por vez. O assunto **Conversar com NPC** fica na mesma lista; alternar assuntos não cria novo modal. Serviços (se disponíveis) são um item opcional. A confirmação direta de aceitar/adiar e a entrega das missões continuam sujeitas às mesmas regras, sem pagamento ao conversar. Rosetta mantém o fluxo tutorial especializado; conversas sem missão usam o sistema já existente.

## 3. Objetivos sempre ancorados a móveis
As quatro missões principais de Terran com `type: interact` agora têm vínculo parametrizável em `src/domain/terran/questActivities.ts`:
- `main_terran_first_home` → `daeryn_healing_shelf`, Casa de Daeryn: **Organizar a Estante de Cura**. Frascos são organizados em Vida → Mana → antídoto; as descrições vêm dos consumíveis existentes `consumable_minor_tonic`, `consumable_simple_ether` e `consumable_antidote`. É um tutorial; não dá itens gratuitos.
- `main_vorren_bestiary` → `vorren_bestiary`, Posto de Vorren: **Pesquisa na estante**. Mosaico de lombadas verticais; abrir páginas e registrar a sequência Fungorros → rastros → registro de campo.
- `main_lithwynn_signs` → `bond_inscription_table`, Mercado: **Marca de Astravél**. Identificar procedência → comparar padrões → registrar como *indício*. O jogador aprende a não declarar uma origem definitiva sem evidências. O efeito é somente o objetivo da missão, não um novo poder ou runa.
- `main_lore_identity_01` → `clan_echo_table`, Salão dos Clãs: **Mesa dos Ecos**, relacionando Personagem → Clã → Classe conforme os princípios atuais. Não escolhe Clã/Classe.

Para completar, o jogador precisa acessar o móvel verdadeiro, selecionar/ler elementos, resolver as três etapas e confirmar. O domínio valida local, missão ativa, ID do móvel e sequência completa antes de aceitar `performTerranQuestTask`. O antigo botão **Realizar objetivo no local** e o atalho **Preparar o alojamento** foram desabilitados; não podem mais concluir o objetivo sem minigame. Interagir com objetos antes de aceitar a missão permite estudo, mas não concede progresso ou recompensas.

## 4. Estante de Eldamar
A Estante dos Registros foi transformada em mosaico de livros interativos com **títulos verticais nas lombadas**: Guia do Viajante, Arsenal Visual, Fundamentos dos Vínculos e sete cadernos temáticos já existentes. A leitura abre a seção selecionada sem tocar no save, sprites ou progressão. Os materiais canônicos existentes foram reutilizados, sem substituir documentos por lore inventado.

## Visual e acessibilidade
Identidade de fantasia arcana pixelada, cores discretas de ouro/azul, botões focáveis, leitura por clique/toque, indicadores 0/3 → 3/3, feedback em escolhas inválidas, Escape para fechar, suportes responsivos e sprites controlados pelo assetRegistry. Tudo é independente da arte; sprites podem ser substituídos sem alterar os objetivos.

## OWNER_DECISION — Marca de Astravél
As observações são apenas uma **hipótese investigativa**. Ainda falta definir no canon a origem física/metafísica exata e quais runas, marcas ou consequências a inscrição terá no futuro. O minigame deliberadamente não atribui causa, bônus ou novo item.

## Testes e publicação
- Testes de domínio garantem vínculo de cada objetivo com local/móvel e bloqueiam conclusões fora da sequência, sem missão, em outra casa ou diretamente pelo antigo botão.
- Testes de UI exercitam poções, livros, investigação e diálogo com uma única janela.
- A suíte CI executa `npm run check` (lint + TypeScript + Vitest + build).
- Esta etapa é somente integração de código ao próximo release; **não publicar no Vercel** até ser solicitada a liberação do deploy consolidado.
