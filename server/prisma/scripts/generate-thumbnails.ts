import { ItemType } from '@prisma/client'
import { prisma } from '../../src/db.js'
import { scheduleItemThumbnailProcessing } from '../../src/resources/items.js'

interface Options {
  tapestryId?: string
  ids?: string[]
  types?: ItemType[]
  forceRegenerate?: boolean
}

export async function generateThumbnails({
  tapestryId,
  ids,
  types,
  forceRegenerate,
}: Options = {}) {
  const items = await prisma.item.findMany({
    where: {
      tapestryId,
      ...(ids ? { id: { in: ids } } : {}),
      ...(types ? { type: { in: types } } : {}),
    },
  })
  for (const item of items) {
    await scheduleItemThumbnailProcessing(item.id, { skipDelay: true, forceRegenerate })
  }
}
