import type { GameSave } from './types'
import { fail, ok, type Result } from '../shared/types'

export type CampaignReset = {
  type: 'CampaignReset'
  ownerId: string
  previousSaveId: string
  previousCampaignId: string
  nextCampaignId: string
  nextCampaignGeneration: number
  occurredAt: string
}

export const requestCampaignReset = (
  save: GameSave,
  nextCampaignId: string,
  occurredAt: string,
): Result<CampaignReset> => {
  if (!nextCampaignId || nextCampaignId === save.campaignId) {
    return fail('INVALID_CAMPAIGN_ID', 'O reset precisa criar uma identidade de campanha nova.')
  }
  return ok({
    type: 'CampaignReset',
    ownerId: save.ownerId,
    previousSaveId: save.saveId,
    previousCampaignId: save.campaignId,
    nextCampaignId,
    nextCampaignGeneration: save.campaignGeneration + 1,
    occurredAt,
  })
}
