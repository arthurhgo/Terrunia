import { expect, test } from '@playwright/test'

test('primeiro Vínculo mantém atributos e arsenal lado a lado em zoom 100%, inclusive janelas baixas', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Lysa')
  await page.getByRole('button', { name: 'Confirmar Terrírian' }).click()
  await expect(page.getByRole('heading', { name: 'O primeiro Vínculo' })).toBeVisible()

  const stats = page.getByRole('region', { name: 'Distribuição de atributos' })
  const weapons = page.locator('.prologue-arsenal')
  await expect(stats).toBeVisible()
  await expect(weapons).toBeVisible()

  // A short browser window must NEVER trigger the mobile stacked layout.
  for (const viewport of [{ width: 1360, height: 580 }, { width: 1024, height: 640 }, { width: 800, height: 700 }]) {
    await page.setViewportSize(viewport)
    const layout = await page.locator('.prologue-screen--enhanced').evaluate((main) => {
      const left = main.querySelector('.prologue-copy')!.getBoundingClientRect()
      const right = main.querySelector('.prologue-arsenal')!.getBoundingClientRect()
      return {
        leftRight: left.right,
        rightLeft: right.left,
        gridColumns: getComputedStyle(main).gridTemplateColumns.split(' ').length,
        mainWidth: main.getBoundingClientRect().width,
      }
    })
    expect(layout.gridColumns, `Colunas em ${viewport.width}x${viewport.height}`).toBe(2)
    expect(layout.leftRight, `Atributos ficam à esquerda em ${viewport.width}x${viewport.height}`).toBeLessThan(layout.rightLeft)
    expect(layout.mainWidth).toBeLessThanOrEqual(viewport.width)
  }

  // A real mobile width still stacks panels without horizontal clipping.
  await page.setViewportSize({ width: 390, height: 844 })
  const mobile = await page.locator('.prologue-screen--enhanced').evaluate((main) => {
    const left = main.querySelector('.prologue-copy')!.getBoundingClientRect()
    const right = main.querySelector('.prologue-arsenal')!.getBoundingClientRect()
    return { leftBottom: left.bottom, rightTop: right.top }
  })
  expect(mobile.rightTop).toBeGreaterThan(mobile.leftBottom)
})
