import { expect, test } from '@playwright/test'
import { fightAndCollect } from './helpers/combatUi'

test('v0.5.14: vence estágio do Vestíbulo, continua na Câmara e reinicia ao sair', async ({ page }) => {
  test.setTimeout(140_000)
  page.setDefaultTimeout(15_000)
  await page.goto('/login')
  await page.getByRole('button', { name: 'Continuar como convidado local' }).click()
  await page.getByPlaceholder('Ex.: Aron').fill('Lysa')
  await page.getByRole('button', { name: 'Confirmar e continuar' }).click()
  await page.getByRole('button', { name: 'Escolher Espada Longa', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Distribuir pontos e vincular Espada Longa', exact: true }).click()
  for (const stat of ['Força', 'Força', 'Astúcia', 'Agilidade', 'Vigor', 'Espírito'])
    await page.getByRole('button', { name: 'Aumentar ' + stat }).click()
  await page.getByRole('button', { name: 'Confirmar Vínculo de Espada Longa — Grau I', exact: true }).click()

  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const save = structuredClone(useGameStore.getState().save!)
    save.eventLog.push('CutsceneViewed:terran_arrival', 'CutsceneViewed:astravel_call',
      'CutsceneViewed:fungal_descent')
    save.quests.main_astravel_corruption.status = 'active'
    save.character.clan.clanId = 'dunavar' // E2E fixture has completed initiation.
    save.world.trailNodeStates.astravel_boss_preview = 'bossCurrent'
    save.world.trailNodeStates.astravel_ruin_threshold_05 = 'completed'
    save.world.currentLocationId = 'astravel_entry'
    useGameStore.setState({ save })
    useGameStore.getState().enterFungalChambers()
  })
  await expect(page.getByRole('heading', { name: 'Câmaras Fúngicas', exact: true })).toBeVisible()
  await expect(page.getByText(/Estágio 1\/3/).first()).toBeVisible()
  await page.getByRole('button', { name: 'Aproximar-se de Vestíbulo Micelial' }).click()
  const drawer = page.getByRole('complementary', { name: 'Painel lateral: Vestíbulo Micelial' })
  await expect(drawer).toBeVisible({ timeout: 20_000 })
  await drawer.getByRole('button', { name: 'Enfrentar estágio 1/3' }).click()
  await expect(page.getByRole('heading', { name: 'Vestíbulo Micelial: Estágio 1/3' })).toBeVisible()
  const dropCount = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const next = structuredClone(useGameStore.getState().save!)
    next.battle!.combatants.combatant_player.attackPower = 120
    for (const actor of Object.values(next.battle!.combatants)) {
      if (actor.side === 'enemy') actor.attackPower = 0
    }
    useGameStore.setState({ save: next })
    return next.battle!.rewards.lootDefinitionIds.length
  })
  await fightAndCollect(page, dropCount)
  await page.getByRole('button', { name: 'CONTINUAR EXPEDIÇÃO', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Câmaras Fúngicas', exact: true })).toBeVisible()
  await expect(page.getByText(/Estágio 2\/3/).first()).toBeVisible()

  await page.getByRole('button', { name: 'Sair das Câmaras para Astravél' }).click()
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    const store = useGameStore.getState()
    if (store.save?.dungeonRun) throw new Error('A tentativa deveria ter sido resetada ao sair')
    store.enterFungalChambers()
  })
  await expect(page.getByRole('heading', { name: 'Câmaras Fúngicas', exact: true })).toBeVisible()
  const state = await page.evaluate(async () => {
    const { useGameStore } = await import('/src/state/gameStore.ts')
    return useGameStore.getState().save?.dungeonRun
  })
  expect(state?.roomIndex).toBe(0)
  expect(state?.stageIndex).toBe(1)
  expect(state?.completedStageIds).toHaveLength(0)
})
