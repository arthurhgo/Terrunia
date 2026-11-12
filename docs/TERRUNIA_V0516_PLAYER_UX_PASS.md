# Terrúnia v0.5.16 — UX do jogador: foco de missão

Estado: UX_DRAFT; proposta no PR #80. Nenhuma regra, save, recompensa ou missão foi alterada.

Problema: com 29 tarefas aceitas, a lateral podia ocultar uma secundária explicitamente rastreada. Havia múltiplos avisos de capítulo sem indicação única da próxima ação.

Implementação:
- Cartão compacto “Próximo passo” escolhe uma missão aceita (preferência ao rastreamento explícito, depois entregas e conteúdo principal).
- Entrega pendente indica o NPC real. Nenhuma entrega automática ou remota.
- Missão ativa mostra o primeiro objetivo incompleto e a contagem real persistida.
- As três secundárias em destaque priorizam missões rastreadas, ainda que de capítulos anteriores.
- Entregas rastreadas aparecem antes das demais no grupo compacto.
- Objetivos com quantidade superior a um exibem o contador na lista.
- Seletores puros; nenhuma alteração de schema, orçamento de drops, gate, batalha, Clã ou vínculo.

QA esperado: executar checks, Playwright e inspecionar visualmente a lateral em 1366×768 e 1920×1080. Manter o PR #80 em draft até aprovação explícita.
