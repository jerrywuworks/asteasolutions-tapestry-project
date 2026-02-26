import { spawn } from 'child_process'
import { ThumbnailRenditionOutput } from './index'
import { generateThumbnail } from './image'

export async function generatePDFThumbnail(
  src: string,
  page: number,
  width: number,
): Promise<ThumbnailRenditionOutput> {
  const res = await fetch(src)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.toLowerCase().startsWith('application/pdf')) {
    throw new Error(`URL did not return a pdf (content-type: ${contentType || 'unknown'})`)
  }

  const inputBuffer = Buffer.from(await res.arrayBuffer())

  return new Promise<ThumbnailRenditionOutput>((resolve, reject) => {
    // prettier-ignore
    const magickArgs = [
      '-limit', 'memory', '256MiB',
      '-limit', 'map', '512MiB',
      '-limit', 'area', '100MP',
      '-density', '300',
      `pdf:-[${page - 1}]`,
      '-background', 'white',
      '-alpha', 'off',
      '-resize', `${width}x`,
      '-quality', '75',
      'jpg:-',
    ]

    const proc = spawn('magick', magickArgs, { stdio: ['pipe', 'pipe', 'pipe'] })
    const chunks: Buffer[] = []
    let err = ''

    proc.stdout.on('data', (d: Buffer) => chunks.push(d))
    proc.stderr.on('data', (d: Buffer) => (err += d.toString()))

    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`magick exited ${code}: ${err}`))

      generateThumbnail(Buffer.concat(chunks)).then(resolve, reject)
    })

    proc.stdin.end(inputBuffer)
  })
}
