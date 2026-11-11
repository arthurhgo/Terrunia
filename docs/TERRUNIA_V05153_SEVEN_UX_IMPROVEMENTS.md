# TERRÚNIA v0.5.15.3 — Consolidação UX em 7 frentes

**Implementação:** branch `fix/v0.5.15.3-terran-market-specialists`  
**Escopo:** revisão incremental da versão v0.5.15.3; não altera o cânon v0.4, preços, equipamentos, categorias, IDs, economia de base ou schema 17.  
**Publicação:** branch de desenvolvimento. Sem merge na `main` ou deploy intencional na Vercel.

## 1. Mercado — apresentação

- A lista de ofertas individuais continua como padrão.
- Alternador acessível permite visualizar os itens em **grade de sprites**, sem recriar kits nem misturar estoques de NPCs.
- Cada peça tem ação **Detalhes**: o usuário pode fixar ou fechar a inspeção com clique/teclado.
- Os controles existentes **Comprar e guardar** / **Comprar e Equipar** continuam independentes.

## 2. Comparação dos equipamentos

- A inspeção reaproveita `previewCommercialEquip` e `deriveCharacterStats`, sem alterar regras.
- Delta positivo/negativo tem representação numérica explícita e contraste diferente.
- Mostra custo e saldo de Ouro projetado; marca peças já equipadas, na mochila ou no Baú.
- Indica bloqueios reais de Vínculo, nível e compra, sem autorizar ações por UI.

## 3. Rosetta — próximo objetivo

- A lição principal ativa mostra um único **Próximo passo**, obtido do primeiro objetivo ainda não concluído.
- Botão direciona à mochila quando a ação é `equip`; caso contrário reutiliza caminho de missões/Diário.
- Não completa missão, não entrega recompensa automaticamente e não modifica `QuestProgress`.

## 4. Mochila — filtros por uso

- Filtros novos: consumíveis, drops e materiais, itens de missão e materiais de Vínculo.
- Mantidos equipamentos, conversíveis, vendáveis e todos; a capacidade e paginação existentes não mudam.
- Itens protegidos de missão apresentam marcador textual **Q**, além da cor.
- Filtros são somente de apresentação: não vendem, convertem ou removem objetos.

## 5. Combate — correspondência real de bônus

- A HUD distingue **bônus diretos dos equipamentos** dos **totais derivados ao entrar em combate** (ataque, defesa, vida/mana máximas e iniciativa).
- Totais vêm de `deriveCharacterStats`; efeitos temporários de combate não são descritos como permanentes.
- Corrigida a apresentação dos revestimentos comerciais de Escudo/Colar/Pulseira antes da conquista dos Vínculos. Nenhum Vínculo é criado automaticamente.
- Nenhum cálculo de dano foi introduzido no React.

## 6. Economia — feedback

- As notificações de compra exibem custo real e saldo remanescente.
- Compras continuam sendo transações de domínio: se rejeitadas, Ouro e itens permanecem intactos.
- Não altera os preços definidos ou em `BALANCE_DRAFT`.

## 7. Save — cobertura adicional

- Regressões cobrem compras encadeadas entre NPCs, IDs únicos entre mochila, equipamento e Baú, preservação de missões, Essência, Vínculos e Ouro no ciclo `migrateAndValidateSave`.
- Mantido o schema atual (17), sem migração desnecessária nem reescrita de saves antigos.

## QA e critérios de aceite

- `npm run check`: TypeScript, oxlint, Vitest e build.
- `npm run e2e -- --project=chromium`: no Vite local via workflow isolado.
- Teste manual recomendado: Rosetta → Mercado (grade/lista) → inspecionar item → comprar → equipar → mochila → combate → retornar e recarregar save.
- Comparações devem refletir exatamente o motor de atributos. Vínculos permanentes não podem ser substituídos por drops comerciais.
- **OWNER_DECISION:** valores de balanceamento de catálogo e biografias/nome próprio dos NPCs continuam pendentes. Nenhum número/nome novo foi canonizado nesta revisão.

## Arquivos centrais

- `src/ui/terran/TerranSpecialistShopV05153.tsx` e `terranSpecialistShopV05153.css`
- `src/ui/terran/RosettaGuide.tsx`
- `src/ui/dashboard/InventoryPanel.tsx` e `inventoryHover.css`
- `src/ui/battle/BattleEquipmentHud.tsx`, `src/domain/combat/battleEquipment.ts`
- `src/state/gameStore.ts` (mensagens após ações já validadas)
- `src/ui/terran/TerranV05153UxRegression.test.tsx`
- `src/domain/combat/battleEquipment.test.ts`
- `src/domain/inventory/marketQuickEquipV05153.test.ts`
- `src/ui/terran/RosettaGuideV05153.test.tsx`
