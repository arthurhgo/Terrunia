# Astravél — expedição contínua em pixels v0.1

Status: `VISUAL_DRAFT`/`CONTENT_DRAFT`, integração técnica de 2026-10-28.

## Identidade visual

- A primeira instância externa tem canvas **384 × 256 px** em perspectiva superior 3/4, coerente com Terran v0.3. Texturas, troncos rúnicos, riacho de energia, vegetação bioluminescente, Fungorros e marcos são desenhados com retângulos de pixels inteiros, sem assets externos obrigatórios.
- A malha técnica de movimento usa células de **8 × 8 px** com corredor transitável em torno dos pontos da definição data-driven `trail_astravel_entry`. Não há colisão atrelada às cores ou sprites.
- O protagonista reaproveita a matriz 16×16 (quadro 32×32) ou spritesheet configurável pelo registro central. Movimento manual, clique, WASD, setas e D-pad; E investiga o marco alcançado. `settings.reducedMotion` pausa efeitos e passadas automáticas.
- Símbolos e marcos: chegada pelo Portal, Fungorro, acampamento, emboscada, limiar e Colosso Micélio. O desenho final e a topografia são provisórios; as posições dos nós vêm de `src/content/trails.ts`.

## Fluxo de progressão preservado

```text
Terran → Praça do Portal → Entrar/Retomar Astravél → /expedition
  → caminhar até nó disponível → inspecionar → ação confirmada
  → acampamento/evento: engine da trilha (loot/flag/salvamento)
  → batalha: engine de turnos → receber recompensa uma vez
  → continuar em /expedition ou registrar retorno a Terran
  → conclusão da rota → retorno pelo Portal a Terran
```

- A rota `/expedition` é acessível apenas quando `GameSave.world.currentLocationId` corresponde a um nó de Astravél. A URL direta não desbloqueia a instância.
- A entrada inicial continua exigindo missão ativa e presença na Praça; os nós são concluídos somente pela engine de domínio. Após a primeira entrada, **retomar** a expedição já descoberta é permitido mesmo se `O Primeiro Rastro` estiver `READY_TO_TURN_IN`/`COMPLETED`, porque a missão se encerra antes dos nós posteriores. A entrada inicial não é recompensada novamente.
- Após vitória, `finishBattleIntoExpedition` encerra apenas o estado de combate já reclamado; loot/XP/Ressonância são concedidos exclusivamente por `claimBattleRewards`. Retirar-se usa `returnToTerran`, mantém os nós concluídos e exige nova autorização de entrada no Portal.
- A cena do limiar e a cena pós-Colosso usam os gatilhos e marcadores já existentes; não alteram as definições de quests.
- Abas de navegação principais ficam ocultas na expedição e combate. Mochila, registro de trilha e missão surgem em painéis laterais, com o canvas do cenário preservado.

## Limites da versão

- A Câmara Fúngica aparece como limiar e espaço do chefe no extremo da trilha. **Ainda não existe um segundo mapa interior completo**, salas individuais, câmera com scrolling ou inimigos com IA livre. Combates continuam em tela própria por serem turn-based.
- Coordenadas do movimento não são salvas: após reload, o ator reaparece no último nó registrado/ativo (combate ou interação concluída), preservando o progresso real do `GameSave` e evitando migração de schema.
- Topografia, animação ambiental, tom narrativo e distribuição de vegetação são `VISUAL_DRAFT`. O conteúdo do acampamento, encontros, chefe e recompensas continua sendo a fonte de verdade já implementada, com marcadores de draft originais.

## Verificação

- Testes de navegação percorrem todos os seis pontos sem atravessar áreas bloqueadas.
- Testes de UI garantem que pontos futuros estejam inacessíveis e que combate só comece após o clique de confirmação no nó disponível.
- Integração testa saída pós-vitória sem pagamento duplo e reentrada da instância sem repetir o registro do Portal.
- E2E visual em navegador real continua pendente até haver Chromium executável no ambiente de testes.
