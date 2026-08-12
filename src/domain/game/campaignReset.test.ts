import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from './createSave'
import { requestCampaignReset } from './campaignReset'

describe('CampaignReset', () => {
  it('gera nova identidade e geração sem alterar autenticação', () => {
    const save = createNewSave('firebase-user', 'Nara', 'character.terririan.default', content)
    const event = requestCampaignReset(save, 'campaign-next', '2026-08-12T15:00:00.000Z')
    expect(event).toMatchObject({
      ok: true,
      value: {
        type: 'CampaignReset',
        ownerId: 'firebase-user',
        previousSaveId: save.saveId,
        previousCampaignId: save.campaignId,
        nextCampaignId: 'campaign-next',
        nextCampaignGeneration: save.campaignGeneration + 1,
      },
    })
  })
})
