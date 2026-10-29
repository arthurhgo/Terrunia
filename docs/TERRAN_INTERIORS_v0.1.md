# Terrúnia — Interiores exploráveis de Terran v0.1

## Regra da experiência (VISUAL_DRAFT)
- Terran conserva as seis instituições oficiais e a Praça do Portal; não é introduzida uma sétima instituição.
- Aproximar-se da porta de uma instituição no mapa exterior abre um **interior explorável**, mantendo a rota `/play` e o mesmo GameShell. A Praça do Portal continua exterior.
- Cada sala usa o mesmo viewport 384×256, navegação 8px com colisão (móveis independentes da arte), atores em matriz de pixels, WASD/setas, toque e botões para controles móveis.
- Moradores e profissionais cadastrados em `terran.ts` são mostrados no **interior** do edifício, incluindo NPCs condicionais apenas após os flags já existentes. Jogador caminha até o NPC; a ação abre diálogo ou a missão disponível pelo mesmo estado do save.
- Ícone de serviços abre o painel lateral sem substituir o interior; a porta inferior retorna ao exterior, junto à casa. Diálogo e serviço não alteram regras de jogabilidade nem inventam lojas, quests ou loot.
- A posição de entrada é estado de UI; visita à instituição continua registrada apenas com seu ID oficial no save. Não é necessário migrar saves.
- Os contratos secundários de NPCs cadastrados seguem disponíveis por seus próprios pré-requisitos. Mestres continuam bloqueados até filiação ao Clã; NPCs condicionais continuam condicionais.

## NPCs das ruas
- A rua reserva uma lista **explícita** `STREET_SIDEQUEST_PRESENCE_IDS`, atualmente vazia.
- Somente NPCs atribuídos à lista **e** associados a missões `secondary` podem aparecer fora. Isso impede que mestres, comerciantes e NPCs da campanha sejam tratados como ambulantes por acidente.
- Criar novos personagens de rua, seus encontros e suas sidequests é **CONTENT_DRAFT / OWNER_DECISION**. Nenhum NPC existente foi transformado silenciosamente em NPC de rua.
- O Guardião do Portal permanece acessível pelo painel da Praça, sem patrulhar as ruas.

## Futuras melhorias
- Art final dos cômodos com sprites substituíveis por assetRegistry;
- Móveis e pontos de interação individualizados;
- Casa independente do Terrírian como local exterior dedicado, sem substituir a função atual do alojamento na Casa de Daeryn;
- Patrolas autônomas dentro dos interiores, eventos narrativos específicos e sidequests externas aprovadas.

## Testes
- Disponibilidade dos seis interiores e ausência de interior na Praça.
- Colisão/caminho e visibilidade de residentes.
- Entrada/saída no mesmo mapa de UI e acesso aos serviços sem tela nova.
