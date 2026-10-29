# Terrúnia — Terran com gameplay centralizada (UI v0.5)
**VISUAL_DRAFT · 29/10/2026**

## Problema reproduzido
Na UI v0.4, a grade `.terran-game__layout` usava `justify-self: end` no cenário, mas a coluna central crescia até ocupar todo o espaço disponível quando o drawer estava fechado. Em uma janela de 1359×603, o canvas terminava colado à direita e as cinco abas ficavam isoladas à esquerda, criando grande vazio.

## Correção
- Um único contêiner `.terran-game__frame`, centrado horizontal e verticalmente na área útil, mantém a proporção 384×256 do cenário e sua posição independente da abertura/fechamento de painéis.
- A faixa de cinco abas de personagem, mochila, missões, evolução e Base fica anexada à **borda esquerda do canvas**; a expansão hover/foco acontece para fora, sem cobrir o personagem.
- Uma faixa direita compacta permite abrir **informações do local** ou **diário contextual**; quando algum painel abre, ele fica ancorado na borda direita, sem deslocar o canvas.
- Em viewports estreitos (até 1200px), o painel contextual é sobreposto ao lado direito do cenário, enquanto a gameplay permanece centrada e com sua proporção estável.
- Em celulares, as faixas compactas seguem anexadas a ambas as bordas, com rótulos acessíveis via aria-label e tooltip. Respeita `prefers-reduced-motion`.
- Desenho de mundo, colisões, combate, diálogos, NPCs e inventário permanecem inalterados.

## Critérios de regressão
1. Rail esquerda, rail direita e cenário compartilham o mesmo `terran-game__frame`.
2. Abrir e fechar qualquer drawer não desmonta nem muda a identidade do canvas.
3. O drawer compartilha o contêiner da cena e não interfere na largura do cenário.
4. Os botões permanecem acessíveis por teclado e com descrições ARIA.
5. Revisão manual em 1366×768, 1920×1080 e celular antes de declarar layout visual definitivo.

A nova estrutura e as regras CSS são **VISUAL_DRAFT**, sem mudança de cânone ou migração de save.
