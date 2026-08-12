# Gameplay social, recrutamento e reset — direção oficial

**Status:** decisão do criador aprovada em 2026-08-12. Esta direção prevalece no domínio de missões, Clãs, Classes e reset de campanha.

## Missões

- NPC apresenta `AVAILABLE` como oferta; conversar produz `OFFERED`, não aceitação.
- Somente a confirmação do jogador produz `ACTIVE` e inclui a missão no Journal.
- `Agora não` retorna a missão a `AVAILABLE`.
- O limite global é `MAX_ACTIVE_QUESTS = 3`, contando `ACTIVE` + `READY_TO_TURN_IN`.
- `LOCKED`, `AVAILABLE`, `OFFERED` e `COMPLETED` não ocupam slot.
- Provas de Clã e Classe usam o mesmo motor, autosave e capacidade.
- Abandono permanece `OWNER_DECISION`.

## Recrutamento de Clã

O jogador pode conhecer os quatro Clãs, mas manter apenas um Vínculo ativo. A sequência é:

`UNKNOWN → KNOWN → três provas concluídas → ELIGIBLE → convite → confirmação → rito → ClanJoined`.

Completar a prova final apenas concede elegibilidade. Não vincula automaticamente. Ao confirmar um Clã, outros processos de filiação são bloqueados sem transformar os Clãs em inimigos. O bônus do Clã passa a integrar atributos derivados.

## Progressão de Classe

Sem `ClanJoined`, nenhuma prova de Classe é liberada. Após o rito, aparecem somente os três Mestres do Clã ativo:

`oferta → aceitação → prova → entrega → ClassEligible → confirmação → ClassUnlocked`.

Após Clã e Classe, a Main Lore usa uma definição central com variante narrativa da Classe ativa.

## Reset de campanha

`CampaignReset` é o único evento crítico de reset. A UX exige duas confirmações e o texto `RESETAR`.

O reset:

- preserva Firebase Auth, Conta Google e preferências de interface;
- incrementa `campaignGeneration` e gera novo `campaignId`;
- invalida o documento cloud anterior em transação;
- limpa os saves locais somente após a invalidação cloud;
- retorna a `/character/create` com a nova geração pronta para receber o novo Terrírian;
- rejeita gravações de gerações antigas e impede restauração do progresso resetado.

Os dados da campanha anterior não são apagados fisicamente pelo cliente: ficam invalidados para garantir auditabilidade e impedir ressurreição. Exclusão definitiva e política de conquistas globais futuras permanecem decisões separadas.
