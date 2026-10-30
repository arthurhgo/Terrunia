# Rosetta — Guardiã do Portal (implementação v0.1)

**Origem:** decisão do proprietário, 30/10/2026. Complementa a MASTER_SPEC v0.4, sem substituí-la.

## Comportamento aprovado

- Rosetta aparece em Terran, ao lado da chegada na Praça do Portal.
- É a única NPC com um **?** numa janela acima da cabeça. Permanece em seu posto.
- Ao interagir, abre um painel de orientação sem trocar a cena do mundo.
- Indica as missões **atualmente aptas a receber** e o NPC e local responsáveis, conforme os estados reais do save.
- Mostra a próxima tarefa de uma missão ativa ou a entrega pendente, priorizando entregas.
- Respeita o limite configurado de missões ativas e não desbloqueia missões, clãs ou classes.
- Aponta a **Biblioteca de Eldamar**, localizada na Casa de Eldamar, e sua **Estante dos Registros**, já interativa.
- Rosetta não tem uma missão secundária automaticamente gerada. Nenhuma recompensa ou ponto é concedido pelo diálogo.

## Dados e visual

NPC ID: `npc_rosetta`; presença: `presence_rosetta`; asset ID: `npc.rosetta.portrait`.
Retrato pixel-art 32×32 substituível pelo assetRegistry: `public/assets/npcs/npc_rosetta_portrait.png`.
O marcador `?` é exclusivo da camada interativa do NPC.
O texto narrativo do diálogo e a aparência final são **CONTENT_DRAFT / VISUAL_DRAFT** e podem ser refinados.

## Regras de progressão

- A fonte da elegibilidade é `save.quests[questId].status`.
- Disponível/ofertada: mostrar o contato responsável; ativa: mostrar próximo objetivo incompleto; pronta para entrega: indicar o NPC de entrega.
- Não adicionar novas quests ou mudar a progressão; manter as ações nos NPCs titulares.
- Modificações em requisitos de quests devem atualizar os dados de conteúdo e a engine, não o painel de Rosetta.
