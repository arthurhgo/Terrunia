# Terrúnia — Arena Pixelada, Portal em Ondas e Contratos v0.1

**29/10/2026 · VISUAL_DRAFT / CONTENT_DRAFT / BALANCE_DRAFT**

## Combate e interface
- Arena independente da exploração (canvas nativo 384×216), herói à esquerda, inimigos ao fundo à direita, cinco Vínculos, PV/MP, ordem da iniciativa, seletor de alvo e registro de combate.
- Ataques, defesa, habilidades desbloqueadas e consumíveis delegam as decisões ao motor de estados existente.
- Arremessáveis, magias, runas e Essências exibem menus explicitamente ainda sem ação; não consomem recursos nem fingem regras.
- Dano oferece flash vermelho e estado derrotado é placeholder visual com o sprite existente girado e dessaturado; animações/sprites finais ainda necessários.
- Vitória exige clicar nos drops antes do comando de confirmação. Recompensas continuam aplicadas uma única vez no save; saídas bloqueadas até coleta.

## Modo Ondas — Praça do Portal
- Acesso após vencer o primeiro Fungorro da trilha normal; ondas progressivas com até quatro inimigos cadastrados, recompensas escaláveis e Vida/Mana persistentes.
- `waveIndex` opcional no estado de combate, preservado pelo schema do save.
- `createWaveBattle` cria uma nova batalha para cada onda, e sua recompensa NÃO avança nós únicos da campanha, NÃO repete o chefe nem suas memórias.
- Sair entre ondas permite recuperação em Terran; derrotas encerram a sessão.

## Contratos NPC — v0.1
- Um contrato secundário data-driven para cada NPC cadastrado (22), com NPC responsável por oferta/entrega e XP/Ouro, eventualmente Essência Bruta.
- Objetivos são kills reais de Fungorro ou Semeador, inclusive no Modo Ondas. Histórias, outros tipos de objetivos e monstros novos ficam para próximas iterações.
- As provas de Clã e Classe não mudam. Cada contrato possui gate próprio (quest principal, Clã conhecido, Clã vinculado ou Classe).
- Save v8→v9 preserva o progresso e adiciona novas quests sem reset.

## OWNER_DECISION
Custos/efeitos de arremessáveis, magia, runas e Essências ativas; parâmetros finais de ondas e drops; arte final de derrota; diversidade narrativa de secundárias; novos sprites de monstros.

Não modifica equipamentos permanentes vinculados nem concede Pontos de Essência diretamente por kills ou níveis.
