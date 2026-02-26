import { JobTypeMap } from './index.js'
import { config } from '../config.js'
import { s3Service, tapestryKey } from '../services/s3-service.js'
import { prisma } from '../db.js'
import { takeTapestryScreenshot } from './thumbnail-generators/tapestry.js'

// 6 times the dimensions of the thumbnail as displayed in the UI
const WIDTH = 6 * 375
const HEIGHT = Math.floor(WIDTH * (10 / 21))

// Inset to clip toolbars near the edges of the tapestry viewer.
const INSET = 100

export async function generateTapestryThumbnail({
  tapestryId,
}: JobTypeMap['generate-tapestry-thumbnail']) {
  const thumbnailKey = tapestryKey(tapestryId, 'thumbnail.jpeg')
  try {
    const tapestry = await prisma.tapestry.findUniqueOrThrow({
      where: { id: tapestryId },
    })
    const thumbnail = await takeTapestryScreenshot(`/t/${tapestryId}`, tapestry.ownerId, {
      width: WIDTH + 2 * INSET,
      height: HEIGHT + 2 * INSET,
      timeout: config.worker.tapestryThumbnailGenerationTimeout,
      clip: {
        x: INSET,
        y: INSET,
        width: WIDTH,
        height: HEIGHT,
      },
    })
    await s3Service.putObject(thumbnailKey, thumbnail, 'image/jpeg')

    await prisma.tapestry.update({
      where: { id: tapestryId },
      data: { thumbnail: thumbnailKey },
    })
  } catch (error) {
    console.error('Error while generating tapestry thumbnail', error)
  }
}
