# Terrúnia — Mundo individual, derrota e Base v0.1
**29/10/2026 · Save v11 · VISUAL_DRAFT / BALANCE_DRAFT**

## Mundos separados por conta
- O mundo jogável é a mesma base de conteúdo para todos, mas estado de missões, marcos, derrotas, drops, baú e personagem **são instâncias privadas por UID e campanha**.
- O Firestore grava em `users/{uid}/saves/{saveId}`. As regras exigem UID autenticado correspondente a `payload.ownerId` e `saveId`, com acesso entre usuários negado. O IndexedDB indexa os saves por ownerId.
- O boot descarta saves com dono inconsistente e respostas assíncronas tardias de contas anteriores. A carga respeita o save/campanha ativos do perfil de nuvem.
- Um Terrírian novo começa sem missões ou marcos concluídos. Campanhas existentes **não são resetadas ou adulteradas**. Se o jogador continuar com seu próprio personagem antigo, o progresso dele continua salvo.
- Para casos específicos de fases concluídas na primeira entrada, será necessário obter informações sobre o UID (sem expor dados sensíveis), o cenário de reprodução e o estado do save; a mudança previne contaminação entre contas mas não supõe uma causa única já confirmada.

## Base do Terrírian
- O edifício antes apresentado como "Casa Fechada" passa a se chamar **Base** e pode ser acessado desde o início. Trata-se de residência particular, não uma sétima instituição de Terran.
- A Base mantém cômodo e planta próprios; seus três móveis interativos são **Mesa das Memórias**, **Cama da Base** e **Baú da Base**.
- A Base possui localização privada `location_terran_base` persistida no save; ao sair pela porta o jogador retorna à Praça do Portal.
- A antiga missão **Um Lugar em Terran** permanece: sua flag registra o alojamento preparado com Daeryn, mas não bloqueia mais a entrada, o descanso nem o baú.

## Derrota e retorno
- Ao atingir 0 PV, a máquina de estados mantém `Defeat` e o HUD exibe uma animação em passos de pixel, com o Terrírian **centralizado**, iluminado de vermelho e caindo.
- Após a animação (ou clique para pular), o estado de combate é encerrado, o mundo leva o personagem à Base e os PV/MP passam a **1 PV / 0 MP**.
- Uma curta transição comunica o despertar. O jogador pode então interagir com a cama para recuperar PV e MP integralmente via `restAtHome`.
- Nenhum XP, Ouro, equipamento, Essência, item do baú ou conclusão de missões é perdido. Não há recompensa de combate em derrota.
- **OWNER_DECISION**: perdas definitivas, durabilidade, custos de ressurreição, limitações do baú e animações finais de sprite. Esta versão não inventa penalidades.

## Baú pessoal
- A propriedade `baseStorage` pertence ao **mesmo save do personagem**, e nunca a um estado global compartilhado.
- O baú guarda itens temporários da mochila (drops e materiais/consumíveis), **não** os cinco itens permanentemente vinculados.
- Depósito/retirada são operações determinísticas e atômicas com validação de IDs únicos, item conhecido, quantidade e local da Base. Itens bloqueados não são depositados.
- O motor suporta pilhas parciais. A interface inicial usa o botão **Guardar** ou **Retirar** para a pilha completa.
- Migração `v10 → v11`: cria armazenamento vazio para saves existentes, preserva todas as outras propriedades e registra o evento de migração.
- As regras de gameplay não dependem de sprite ou estado do canvas.

## Testes
- Mundos e missões independentes ao criar saves de dois jogadores.
- Carregamento da conta, prevenção contra respostas tardias e escolha do save ativo.
- Derrota → Base, persistência de dados existentes, descanso e baú bidirecional.
- Schema v11, migração, Firestore payload e teste de integração da campanha.

**Observação:** os efeitos visuais são `VISUAL_DRAFT`. O conteúdo de mundo permanece conforme o master spec v0.4 e nenhuma regra de Clã ou Classe foi adicionada.
