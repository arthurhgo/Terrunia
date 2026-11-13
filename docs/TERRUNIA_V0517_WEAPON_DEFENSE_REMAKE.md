# Terrúnia v0.5.17 — Remake de Armas e Defesas

**Status:** BALANCE_DRAFT / UX_DRAFT. Master Spec v0.4 prevalece; nenhuma regra não aprovada é canon.

## Diagnóstico
Na v0.5.16.1, o Ataque Único/Duplo/Área era global, técnicas diferiam sobretudo em custo/bônus aditivo, e o botão Defender mitigava automaticamente. A navegação de vitória na lateral foi um hotfix: o proprietário agora pede o retorno à seção central.

## Arsenal por arma
| Arma | Básico | Área | Identidade |
|---|---|---|---|
| Arco | Flecha Direta | Flecha de Dispersão | Perfurante; Flecha Perfurante / Flecha Guiada / Chuva de Flechas |
| Machado | Machadada | Varredura do Machado | Golpes pesados e ruptura |
| Cetro | Projétil Arcano | Onda de Energia | Conjuração mágica escalando em Astúcia |
| Espada | Corte de Espada | Varredura da Lâmina | Cortes |
| Adaga | Estocada de Adaga | Corte Circular | Mobilidade |
| Grimório | Selo Projetado | Selo Disperso | Inscrições |
| Cajado | Pulso do Cajado | Onda de Conjuração | Fluxo mágico |

Ataque Duplo eliminado da interface e comandos ativos. Legados que tentem executá-lo recebem erro sem avançar. As ações padrão mantêm o dado existente por arma e os limites atuais de área para evitar alterar silenciosamente o dano.

Cetro: Dardo Etéreo no Grau I (2 MP, recarga 1, bônus +1); Nova Arcana no Grau II (4 MP, recarga 3, dado +1 e 25% de dano adjacente), além das três técnicas existentes. Propostas BALANCE_DRAFT.

## Defesa do Nexo — disponível em qualquer Classe
Como a Classe só é desenvolvida no Clã, quatro técnicas iniciais universais do Terrírian evitam travas na criação. Futuras especializações por Classe precisam de OWNER_DECISION.

| Técnica | MP | Recarga | Dado contra | Sucesso | Falha |
|---|---:|---:|---|---|---|
| Bloqueio | 0 | 1 | Vigor ≥3 | reduz 3 de dano, escudo +1 ao teste e redução | dano integral |
| Aparar | 1 | 2 | Agilidade ≥4 | evita o golpe; escudo +1 ao teste | dano integral |
| Esquiva | 1 | 2 | Agilidade ≥4 | evita golpe | dano integral |
| Contragolpe | 2 | 3 | Força ≥4 | reduz 2 e devolve 40% do ATQ | não reage |

O dado do atributo (d4, d6, d8, d10, d12) é rolado no golpe inimigo e persistido pelo RNG do combate, com log de sucesso ou falha. Nenhuma postura é garantida. O botão antigo DEFENDER some, embora o comando legado permaneça internamente para compatibilidade histórica.

## Layout de vitória
A coluna central possui resumo rolável e rodapé fixo **Próximos passos**, com coletar/continuar/retornar/próxima onda. A coluna direita mostra drops, mochila e recuperação opcional, sem consumo automático. Evita reproduzir a tela travada da v0.5.16.

## QA e decisões
- Revisar o balanceamento dos quatro testes de reação, custo de Mana, cooldown e as magias do Cetro após playtests.
- As árvores e técnicas exclusivas das 12 Classes são OWNER_DECISION; acesso universal não antecipa Classe nem Clã.
- Sprites e VFX finais permanecem VISUAL_DRAFT, com IDs/placeholder.
- Sem aumento de versão do save schema: novos dados de combate são opcionais.
- CI, Vitest, Playwright, combate de dungeon e modo de ondas obrigatórios antes do merge.
