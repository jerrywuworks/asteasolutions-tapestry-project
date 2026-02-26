import { spawn } from 'node:child_process'
import { unlink } from 'node:fs'
import { noop } from 'lodash-es'
import { downloadToTempFile } from '../utils'
import { ThumbnailRenditionOutput } from '.'
import { generateThumbnail } from './image'

function extractVideoThumbnailFromFile(
  filePath: string,
  startTime = 1,
  width = 320,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // prettier-ignore
    const args = [
      "-hide_banner",
      "-loglevel", "error",
      "-nostdin",
      "-ss", String(startTime),
      "-i", filePath,
      "-frames:v", "1",
      "-an", "-sn", "-dn",
      // scale with aspect preserved; -2 makes height even
      "-vf", `scale=${width}:-2:flags=lanczos`,
      "-f", "image2pipe",
      "-vcodec", "mjpeg",
      "pipe:1",
    ];

    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] })

    const chunks: Buffer[] = []
    let err = ''

    proc.stdout.on('data', (d: Buffer) => chunks.push(d))
    proc.stderr.on('data', (d: Buffer) => (err += d.toString('utf8')))

    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg exited ${code}: ${err}`))
      resolve(Buffer.concat(chunks))
    })
  })
}

export async function generateVideoThumbnail(
  videoUrl: string,
  startTime: number | undefined,
  width: number,
): Promise<ThumbnailRenditionOutput> {
  let tmpFile = ''
  try {
    tmpFile = await downloadToTempFile(videoUrl)
    const frame = await extractVideoThumbnailFromFile(tmpFile, startTime, width)
    return generateThumbnail(frame)
  } finally {
    unlink(tmpFile, noop)
  }
}
