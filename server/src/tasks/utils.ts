import { createWriteStream } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { finished } from 'node:stream/promises'

export interface DownloadOpts {
  timeoutMs?: number
  maxBytes?: number
  allowedContentTypePrefixes?: string[] // e.g. "video/"
}

export async function downloadImageToArrayBuffer(url: string) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.startsWith('image/')) {
    throw new Error(`URL did not return an image (content-type: ${contentType || 'unknown'})`)
  }

  return Buffer.from(await res.arrayBuffer())
}

export async function downloadToTempFile(urlStr: string, opts: DownloadOpts = {}) {
  const url = new URL(urlStr)

  const {
    timeoutMs = 60_000,
    maxBytes = 200 * 1024 * 1024, // 200MB default limit
    allowedContentTypePrefixes,
  } = opts

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs)

  const res = await fetch(url, {
    redirect: 'follow',
    signal: abortController.signal,
  }).finally(() => clearTimeout(timeoutId))

  if (!res.ok || !res.body) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)

  const contentType = (res.headers.get('content-type') || '').toLowerCase()
  if (allowedContentTypePrefixes?.every((prefix) => !contentType.startsWith(prefix))) {
    throw new Error(`Not a matching content-type: ${contentType || 'unknown'}`)
  }

  const contentLength = res.headers.get('content-length')
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new Error(`Content too large (content-length=${contentLength})`)
  }

  const extension = extname(url.pathname) || '.bin'
  const filePath = join(tmpdir(), `file-${randomUUID()}${extension}`)
  await finished(Readable.fromWeb(res.body).pipe(createWriteStream(filePath)))

  return filePath
}
