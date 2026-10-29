# Terrúnia — NPCs de Rua e Contratos de Astravél v0.1

**29/10/2026 · CONTENT_DRAFT / BALANCE_DRAFT / VISUAL_DRAFT.**

Seis novos moradores dedicados exclusivamente às **missões secundárias de rua**. Nenhum morador institucional ou Mestre de Classe mudou de localização. Os seis edifícios e a Praça do Portal permanecem intactos.

| NPC | Ocupação | Missão | Objetivo | Recompensa |
|---|---|---|---|---|
| Arlen | Mensageiro | Caminhos de Entrega | 2 Fungorros Rastejantes | 35 XP, 18 Ouro |
| Liora | Coletora | O Ar que Floresce | 2 Semeadores | 45 XP, 22 Ouro, 15 Essência Bruta |
| Garrik | Vigilante | Vigília além dos Muros | 3 Fungorros Rastejantes | 55 XP, 28 Ouro |
| Siven | Cartógrafo | O Mapa da Gosma | 2 Bolas de Gosma Fúngica | 75 XP, 35 Ouro, 20 Essência Bruta |
| Nara | Observadora | Padrões na Bruma | 3 Semeadores | 75 XP, 35 Ouro, 20 Essência Bruta |
| Ruven | Explorador | A Sombra Esporulante | 1 Horror Esporulante | 95 XP, 50 Ouro, 30 Essência Bruta |

### Jogabilidade
- Personagens usam sprites individuais PNG RGBA 32×32, 16×16 no mundo com escala inteira, IDs em `assetRegistry` e registro no manifesto do Work.
- Posições estáveis fora dos prédios, patrulhas ambientais curtas com verificação de colisão, marcadores de oferta e entrega.
- Aproximação por WASD, setas, clique/toque e diálogo na rua; missões aparecem no painel ao lado sem desmontar a cena.
- As seis missões só são oferecidas após requisitos das quests principais; **aceitação manual e máximo de 3 missões ativas** continuam obrigatórios.
- Contadores só avançam por eventos reais de vitória em Astravél/Modo Ondas, com entrega manual a quem ofereceu. Não liberam Clã, Classe ou Pontos de Essência diretamente.
- Os dados numéricos são `BALANCE_DRAFT`. Os nomes e histórias são `CONTENT_DRAFT`, não são cânone definitivo.
- Migração `v9 → v10` acrescenta registros de missões e relações sem sobrescrever progressão, inventário, Ouro ou o save existente.
- Sprites substituíveis em `public/assets/npcs`; gerador `scripts/build_pixel_assets.py` documenta a arte pixelada provisória.

### OWNER_DECISION
Histórias definitivas dos novos NPCs, tipos variados de objetivos (exploração, puzzle, coleta), novas recompensas, aparências finais, horários de patrulha e consequências sociais.
