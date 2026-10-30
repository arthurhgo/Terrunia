# Astravél — expedição contínua em pixels v0.1

> Histórico: a rota e o tamanho do mapa foram substituídos pelo [remake v0.2](ASTRAVEL_REMAKE_v0.2.md), aprovado em 2026-10-30.

Status: `VISUAL_DRAFT`/`CONTENT_DRAFT`, integração técnica de 2026-10-28.

## Identidade visual

- A primeira instância externa tem canvas **384 × 256 px** em perspectiva superior 3/4, coerente com Terran v0.3. Texturas, troncos rúnicos, riacho de energia, vegetação bioluminescente, Fungorros e marcos são desenhados com retângulos de pixels inteiros, sem assets externos obrigatórios.
- A malha técnica de movimento usa células de **8 × 8 px** em toda a instância. O caminho de terra orienta, mas não restringe deslocamento: bordas e árvores desenhadas são os colisores físicos compartilhados entre arte e pathfinding.
- O protagonista reaproveita a matriz 16×16 na mesma escala dos NPCs, com aura amarela pixelada, ou spritesheet configurável pelo registro central. Movimento manual, clique, WASD, setas e D-pad; E investiga o marco alcançado. `settings.reducedMotion` pausa efeitos e passadas automáticas.
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
- Livre exploração fora da trilha não altera o estado dos marcos. A progressão continua sequencial e somente o marco `current`/`available` pode executar sua ação.

## Limites da versão

- O marco final da trilha agora dá acesso ao **segundo mapa interior das Câmaras Fúngicas**, com quatro salas contínuas (incremento v0.2). Ver `docs/FUNGAL_CHAMBERS_DUNGEON_v0.1.md`. Câmera com scrolling, inimigos com IA livre e encontros adicionais dentro dos corredores ainda não existem. Combates continuam em tela própria por serem turn-based.
- Coordenadas do movimento não são salvas: após reload, o ator reaparece no último nó registrado/ativo (combate ou interação concluída), preservando o progresso real do `GameSave` e evitando migração de schema.
- Topografia, animação ambiental, tom narrativo e distribuição de vegetação são `VISUAL_DRAFT`. O conteúdo do acampamento, encontros, chefe e recompensas continua sendo a fonte de verdade já implementada, com marcadores de draft originais.

## Verificação

- Testes de navegação percorrem todos os seis pontos sem atravessar áreas bloqueadas.
- Testes de UI garantem que pontos futuros estejam inacessíveis e que combate só comece após o clique de confirmação no nó disponível.
- Integração testa saída pós-vitória sem pagamento duplo e reentrada da instância sem repetir o registro do Portal.
- O fluxo visual foi validado em navegador real em 2026-10-29: Terran → Portal → Astravél → primeiro encontro → combate → retorno à instância, em `/play`, sem rolagem vertical.
