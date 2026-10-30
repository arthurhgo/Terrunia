import { expect, test } from '@playwright/test'

test('Astravél abre o painel da instância à esquerda sem sair do enquadramento', async ({ page }) => {
  await page.goto('/login')

  // Use the app's real styles with the same scene/drawer DOM grammar.
  // The regression was CSS positioning relative to an absent Terran frame.
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
        </section>
        <aside class="terran-game__drawer" aria-label="Painel lateral: Rota de Astravél">
          <header><h2>Rota de Astravél</h2><button aria-label="Fechar painel">×</button></header>
          <div class="terran-game__drawer-content">Rota e missão atual</div>
        </aside>
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
      const drawer = root.querySelector('.terran-game__drawer')!.getBoundingClientRect()
      const button = root.querySelector<HTMLButtonElement>('[aria-label="Fechar painel"]')!.getBoundingClientRect()
      return {
        stage: { left: stage.left, right: stage.right, top: stage.top },
        drawer: { left: drawer.left, right: drawer.right, top: drawer.top, bottom: drawer.bottom },
        close: { left: button.left, right: button.right },
      }
    })

    expect(layout.drawer.left, `Painel visível em ${viewport.width}x${viewport.height}`).toBeGreaterThanOrEqual(0)
    expect(layout.drawer.right).toBeLessThanOrEqual(viewport.width)
    expect(layout.drawer.bottom).toBeLessThanOrEqual(viewport.height)
    expect(layout.close.left).toBeGreaterThanOrEqual(0)
    expect(layout.close.right).toBeLessThanOrEqual(viewport.width)
    if (viewport.width > 960) {
      expect(layout.drawer.right, 'Painel à esquerda do mapa').toBeLessThan(layout.stage.left)
    }
  }

  // The map does not jump when opening the left-side instance panel.
  await page.setViewportSize({ width: 1792, height: 838 })
  const stage = page.locator('#expedition-drawer-regression .terran-game__stage')
  const before = await stage.boundingBox()
  await page.locator('#expedition-drawer-regression .terran-game__drawer').evaluate((node) => node.remove())
  await page.locator('#expedition-drawer-regression .expedition-game__layout')
    .evaluate((node) => node.classList.remove('has-drawer'))
  const after = await stage.boundingBox()
  expect(before).not.toBeNull()
  expect(after).not.toBeNull()
  expect(Math.abs(before!.x - after!.x)).toBeLessThan(1)
  expect(Math.abs(before!.width - after!.width)).toBeLessThan(1)
})
