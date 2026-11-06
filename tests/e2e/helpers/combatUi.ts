import { expect, type Page } from '@playwright/test'

/** Drive the real initiative, action, roll and reward UI without bypassing combat. */
export async function fightAndCollect(page: Page, expectedDropCount: number) {
  const started = Date.now()
  let phase: string | null = null
  const initiative = page.getByRole('button', { name: /^Arrastar dado de iniciativa d\d+ para cima para rolar$/ })
  const playerDie = page.getByRole('button', { name: /^Arrastar dado d\d+ para cima para rolar$/ })
  const menu = page.getByRole('button', { name: 'ATAQUE · MAGIAS · HABILIDADES', exact: true })

  while (Date.now() - started < 65_000) {
    phase = await page.evaluate(async () => {
      const { useGameStore } = await import('/src/state/gameStore.ts')
      return useGameStore.getState().save?.battle?.phase ?? null
    })
    if (phase === 'Victory') break
    if (phase === 'Defeat' || !phase) throw new Error('Combat stopped without player victory: ' + phase)

    // During a cinematic preview the domain phase can still be AwaitingAction.
    // The player must release a die before a second command may be chosen.
    if (await playerDie.isVisible().catch(() => false)) {
      await playerDie.press('Enter')
      await page.waitForTimeout(120)
      continue
    }
    if (phase === 'AwaitingInitiative' && await initiative.isEnabled().catch(() => false)) {
      await initiative.press('Enter')
      await page.waitForTimeout(120)
      continue
    }
    if (phase === 'AwaitingAction' && await menu.isEnabled().catch(() => false)) {
      await menu.click()
      await page.getByRole('button', { name: 'ATAQUE BÁSICO · 0 MP', exact: true }).click()
      await page.waitForTimeout(120)
      continue
    }
    await page.waitForTimeout(120)
  }
  if (phase !== 'Victory') {
    const gate = await page.locator('.pixel-battle__actions').getAttribute('data-turn-gate').catch(() => null)
    throw new Error('Battle presentation did not finish: phase=' + phase + ', actionGate=' + gate)
  }

  await expect(page.getByRole('heading', { name: 'VITÓRIA', exact: true })).toBeVisible()
  const rawLootCount = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    return useGameStore.getState().save?.battle?.rewards.lootDefinitionIds.length
  })
  expect(rawLootCount).toBe(expectedDropCount)
  await page.getByRole('button', { name: 'RECOLHER TODOS OS ESPÓLIOS', exact: true }).click()
  await expect(page.getByRole('button', { name: 'RECOLHER TODOS OS ESPÓLIOS', exact: true })).toHaveCount(0)
}
