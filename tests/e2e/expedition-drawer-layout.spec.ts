import { expect, test } from '@playwright/test'

test('Astravél mantém o mapa central e abre janela de instância centralizada DENTRO do cenário', async ({ page }) => {
  await page.goto('/login')

  // Reproduce the real Astravél DOM hierarchy with the application's CSS.
  // Previously the window was placed far outside the scene in a reserved left column.
  await page.evaluate(() => {
    const fixture = document.createElement('main')
    fixture.id = 'expedition-drawer-regression'
    fixture.className = 'terran-game expedition-game'
    fixture.style.cssText = 'position:fixed;inset:64px 12px 12px;width:auto;height:auto;max-width:none;z-index:9999;'
    fixture.innerHTML = `
      <header class="terran-game__topbar"><h1>Astravél</h1></header>
      <div class="terran-game__layout expedition-game__layout has-drawer">
        <section class="terran-game__stage" aria-label="Cena contínua de Astravél">
          <nav class="terran-game__hud"><button>Trilha</button></nav>
          <button class="expedition-game__drawer-backdrop" aria-label="Fechar janela da instância"></button>
          <aside class="terran-game__drawer expedition-game__window" aria-label="Painel lateral: Acampamento Abandonado">
            <header><h2>Acampamento Abandonado</h2><button aria-label="Fechar painel">×</button></header>
            <div class="terran-game__drawer-content">Vasculhar acampamento</div>
          </aside>
        </section>
      </div>`
    document.body.append(fixture)
  })

  for (const viewport of [
    { width: 1792, height: 838 },
    { width: 1366, height: 768 },
    { width: 1024, height: 768 },
    { width: 960, height: 720 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    const layout = await page.locator('#expedition-drawer-regression').evaluate((root) => {
      const stage = root.querySelector('.terran-game__stage')!.getBoundingClientRect()
      const drawer = root.querySelector('.expedition-game__window')!.getBoundingClientRect()
      const button = root.querySelector<HTMLButtonElement>('[aria-label="Fechar painel"]')!.getBoundingClientRect()
      return {
        stage: { left: stage.left, right: stage.right, top: stage.top, bottom: stage.bottom },
        drawer: { left: drawer.left, right: drawer.right, top: drawer.top, bottom: drawer.bottom },
        close: { left: button.left, right: button.right },
      }
    })
    const stageCenterX = (layout.stage.left + layout.stage.right) / 2
    const windowCenterX = (layout.drawer.left + layout.drawer.right) / 2
    const stageCenterY = (layout.stage.top + layout.stage.bottom) / 2
    const windowCenterY = (layout.drawer.top + layout.drawer.bottom) / 2

    expect(layout.stage.left, `Mapa enquadrado em ${viewport.width}x${viewport.height}`).toBeGreaterThanOrEqual(0)
    expect(layout.stage.right).toBeLessThanOrEqual(viewport.width)
    expect(Math.abs(stageCenterX - viewport.width / 2), 'Mapa centralizado na tela').toBeLessThan(15)
    expect(layout.drawer.left, 'Janela contida na borda esquerda do cenário').toBeGreaterThanOrEqual(layout.stage.left - 1)
    expect(layout.drawer.right, 'Janela contida na borda direita do cenário').toBeLessThanOrEqual(layout.stage.right + 1)
    expect(layout.drawer.top).toBeGreaterThanOrEqual(layout.stage.top - 1)
    expect(layout.drawer.bottom).toBeLessThanOrEqual(layout.stage.bottom + 1)
    expect(Math.abs(windowCenterX - stageCenterX), 'Janela centralizada horizontalmente no jogo').toBeLessThan(2)
    expect(Math.abs(windowCenterY - stageCenterY), 'Janela centralizada verticalmente no jogo').toBeLessThan(2)
    expect(layout.close.left).toBeGreaterThanOrEqual(layout.drawer.left)
    expect(layout.close.right).toBeLessThanOrEqual(layout.drawer.right)
  }

  // The scene stays at the exact same position when the window closes.
  await page.setViewportSize({ width: 1792, height: 838 })
  const stage = page.locator('#expedition-drawer-regression .terran-game__stage')
  const before = await stage.boundingBox()
  await page.locator('#expedition-drawer-regression .expedition-game__window').evaluate((node) => node.remove())
  await page.locator('#expedition-drawer-regression .expedition-game__drawer-backdrop').evaluate((node) => node.remove())
  await page.locator('#expedition-drawer-regression .expedition-game__layout')
    .evaluate((node) => node.classList.remove('has-drawer'))
  const after = await stage.boundingBox()
  expect(before).not.toBeNull()
  expect(after).not.toBeNull()
  expect(Math.abs(before!.x - after!.x)).toBeLessThan(1)
  expect(Math.abs(before!.width - after!.width)).toBeLessThan(1)
})
