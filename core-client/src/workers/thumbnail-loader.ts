import type { Size } from 'tapestry-core/src/lib/geometry'

interface BaseThumbnailLoadMessage {
  requestId: string
  itemId: string
}

export interface ThumbnailLoadRequest extends BaseThumbnailLoadMessage {
  url: string
  resize?: Size
}

export interface ThumbnailLoadResponse extends BaseThumbnailLoadMessage {
  ok: true
  bitmap: ImageBitmap
}

export interface ThumbnailLoadError extends BaseThumbnailLoadMessage {
  ok: false
  error: string
}

onmessage = async (e: MessageEvent<ThumbnailLoadRequest>) => {
  const { requestId, itemId, url, resize } = e.data
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()

    const bitmap = await createImageBitmap(
      blob,
      resize
        ? {
            resizeWidth: resize.width,
            resizeHeight: resize.height,
            resizeQuality: 'high',
          }
        : undefined,
    )

    postMessage({ requestId, itemId, ok: true, bitmap } satisfies ThumbnailLoadResponse, {
      transfer: [bitmap],
    })
  } catch (error) {
    const message = String((error as { message?: string }).message ?? error)
    postMessage({ requestId, itemId, ok: false, error: message } satisfies ThumbnailLoadError)
  }
}
