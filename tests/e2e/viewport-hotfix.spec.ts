import { expect, test } from '@playwright/test'

test('v0.5.10.1: Terran ocupa viewport real; painéis no interior e abas acessíveis no zoom', async ({ page }, testInfo) => {
  test.setTimeout(150_000)
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Viewport')
  await expect(page.getByRole('button', { name: 'Adicionar ponto de Força' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Confirmar e continuar' }).click()
  await page.getByRole('button', { name: 'Escolher Espada Longa', exact: true }).click()
  await page.getByRole('button', { name: 'Distribuir pontos e vincular Espada Longa', exact: true }).click()
  for (const attribute of ['Força', 'Força', 'Astúcia', 'Agilidade', 'Vigor', 'Espírito']) {
    await page.getByRole('button', { name: 'Aumentar ' + attribute }).click()
  }
  await page.getByRole('button', { name: 'Confirmar Vínculo de Espada Longa — Grau I', exact: true }).click()
  await page.getByRole('button', { name: 'Pular cena' }).click()
  for (const viewport of [
    { width: 1366, height: 768 }, { width: 1920, height: 1080 },
    { width: 1440, height: 900 }, { width: 1024, height: 768 },
    { width: 2560, height: 1080 }, { width: 844, height: 390 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    const boxes = await page.locator('.terran-game__frame').evaluate((frame) => {
      const rectangle = (selector: string) => {
        const r = frame.querySelector(selector)!.getBoundingClientRect()
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }
      }
      return {
        frame: rectangle('.terran-game__stage'),
        left: rectangle('.terran-game__fixed-left'),
        right: rectangle('.terran-character-hud'),
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
      }
    })
    expect(boxes.pageWidth, `sem rolagem horizontal ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(viewport.width)
    expect(boxes.frame.left).toBeGreaterThanOrEqual(0)
    expect(boxes.frame.right).toBeLessThanOrEqual(viewport.width)
    expect(boxes.frame.width).toBeGreaterThan(180)
    expect(boxes.frame.bottom).toBeLessThanOrEqual(viewport.height + 1)
    if (viewport.width > 1040) {
      expect(boxes.left.left).toBeGreaterThanOrEqual(0)
      expect(boxes.left.right).toBeLessThanOrEqual(boxes.frame.left + 1)
      expect(boxes.right.left).toBeGreaterThanOrEqual(boxes.frame.right - 1)
      expect(boxes.right.right).toBeLessThanOrEqual(viewport.width)
      await expect(page.getByRole('complementary', { name: 'Diário de missões' })).toBeVisible()
      await expect(page.getByRole('complementary', { name: 'Status permanente do personagem' })).toBeVisible()
    } else {
      const missions = page.getByRole('button', { name: 'Abrir ou fechar aba de missões' })
      const status = page.getByRole('button', { name: 'Abrir ou fechar aba de status' })
      await missions.click()
      await expect(page.getByRole('complementary', { name: 'Diário de missões' })).toBeVisible()
      await missions.click()
      await status.click()
      await expect(page.getByRole('complementary', { name: 'Status permanente do personagem' })).toBeVisible()
      await status.click()
    }
    await page.screenshot({ path: testInfo.outputPath(`terran-${viewport.width}x${viewport.height}.png`), animations: 'disabled' })
  }
})
