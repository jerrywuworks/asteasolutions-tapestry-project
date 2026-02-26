import sharp from 'sharp'
import { ThumbnailRenditionOutput } from '.'
import { downloadImageToArrayBuffer } from '../utils'

interface DownscaleConfig {
  maxDim: number
  optimizeForText?: boolean
}

export async function generateThumbnail(
  inputBuffer: Buffer<ArrayBufferLike>,
  downscale?: DownscaleConfig,
): Promise<ThumbnailRenditionOutput> {
  const output = sharp(inputBuffer, { failOn: 'none' }).rotate()

  if (downscale) {
    output.gamma().resize({
      width: downscale.maxDim,
      height: downscale.maxDim,
      fit: 'inside',
      withoutEnlargement: true,
      fastShrinkOnLoad: false,
    })
    if (downscale.optimizeForText) {
      output.sharpen({ sigma: 0.5 })
    }
  }

  output.webp({ lossless: true, effort: 6 })

  const { data, info } = await output.toBuffer({ resolveWithObject: true })

  return {
    data,
    format: 'webp',
    extension: 'webp',
    size: {
      width: info.width,
      height: info.height,
    },
  }
}

export async function generateImageThumbnail(
  imageUrl: string,
  downscale: DownscaleConfig = { maxDim: 1024 },
): Promise<ThumbnailRenditionOutput> {
  return generateThumbnail(await downloadImageToArrayBuffer(imageUrl), downscale)
}
