# Terrúnia v0.5.17 — Escudaria, ESC, ARC e iniciativa

**Estado:** BALANCE_DRAFT / UX_DRAFT / VISUAL_DRAFT. A master spec v0.4 permanece autoridade. PR #82 Draft.

## Cinco vínculos preservados
A Escudaria especializa o slot permanente shield (não cria um sexto vínculo):
- Escudo físico: limiar ESC que precisa ser superado para tirar Vida. ESC é proteção passiva por golpe e não se esgota; Bloqueio ativo continua tendo sucesso/falha nos dados.
- Protetor Arcano: reserva ARC de proteção mágica consumida em combate, não regenerada gratuitamente.
- Aljava Vinculada: ocupa o mesmo slot, sem ESC físico, favorece arqueiros e dá +1 de iniciativa. Não troca item permanente já vinculado.

BALANCE_DRAFT: ESC = mínimo de 6 e (poder base do escudo + piso((grau-1)/2)). ARM física exclui o bônus de mitigação do escudo para evitar contagem dupla. O motor explica absorção de ESC, ARM, ARC antes da perda de HP. A ordem exata do cálculo de danos e sua calibração devem ser inspecionadas em playtest.

## Dûn'Avar — tradição marcial e arcana
A lore fundamenta a defesa física e a Barreira Arcana de Terran. Depois da filiação ao Clã, o personagem tem acesso adicional à técnica Conjurar Barreira de Dûn’Avar (3 MP, recarga 3, até +4 ARC). O escudo físico não precisa ser removido. Um Terrírian sem Clã não adquire essa habilidade automaticamente.

Perfis iniciais não equivalem a classes: mago com cetro/cajado/grimório pode lançar Véu Arcano (2 MP, recarga 3, até +3 ARC); duelista de espada/adaga recebe +1 no teste de Aparar; escudeiro com escudo ganha bônus de Bloqueio; arqueiro com Aljava aprende Foco da Aljava. Classes e Clãs seguem aquisição durante o jogo.

## Iniciativa por status
No começo do encontro, a rolagem considera dado de Agilidade e modificadores de status. Status ativos podem elevar ou reduzir o passo do dado (d4, d6, d8, d10, d12) e o bônus fixo:
- Pressa Arcana: +2 iniciativa, +1 passo.
- Lentidão: -2 iniciativa, -1 passo.
- Enraizado: -2 iniciativa, -1 passo.
- Postura Rompida: -1 iniciativa, -1 passo, -1 defesa.
- Foco do Arqueiro: +1 passo.

A reordenação ocorre na próxima rodada apenas quando há modificador real; o jogo não concede turnos extras nem altera o RNG por UI. Como o dado de iniciativa é lançado uma vez por encontro, alterações de passo adquiridas durante a batalha equivalem provisoriamente a +/-2 pontos por passo no próximo cálculo da ordem (BALANCE_DRAFT), sem nova rolagem.

## Combate e itens
Arcos, cetros, machados, espadas, adagas, grimórios e cajados têm ataques próprios; Ataque Duplo foi removido. Novas habilidades incluem Flecha Imobilizadora, Quebra-Guarda, Aceleração Etérea, Foco da Aljava, Véu Arcano e Conjurar Barreira de Dûn’Avar.

Equipamento vinculado não é substituído por drop ou por outro Vínculo. O sistema de aljava está definido e exibido no catálogo, mas sua aquisição via NPC/rito ainda é OWNER_DECISION, não há vínculo concedido silenciosamente.

## Sprites e interface
32 ícones pixelados transparentes VISUAL_DRAFT (16 × 16; Aljava 32 × 32), usando SVG com pixel grid e IDs substituíveis: 14 ataques por família, 12 habilidades, 5 status e uma Aljava. Os PNGs existentes de poções, runas, materiais e drops permanecem preservados. Criação futura de sprites PNG definitivos não deve alterar gameplay.

O HUD mostra Vida/Mana, ESC, ARM e ARC, além do resultado de absorção. Os tooltips descrevem iniciativa, rolagens, chance de reação e recarga. O rodapé PRÓXIMOS PASSOS fica na seção central VITÓRIA com botões sempre visíveis, enquanto a mochila e recuperação opcional ficam à direita.

## QA e decisões
Compatibilidade do schema: campos opcionais no combate, sem alterar o número dos cinco Vínculos. Executar CI, Vitest, Playwright, Golem e Sentinela, campanha/ondas e jogo em viewport baixo. Testes novos verificam limiar físico, ARC esgotável, Clã Dûn'Avar, Aljava, alteração de iniciativa, saves e assets.

OWNER_DECISION: preço e rito de obtenção da Aljava, resistências por espécie, bônus definitivos, magias finais por Classe, sprites finais e balanceamento depois do playtest. Não fazer merge automático ou deploy de produção sem autorização.
