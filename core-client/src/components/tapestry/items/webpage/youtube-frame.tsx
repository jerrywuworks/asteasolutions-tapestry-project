import { useEffect, useMemo, useRef } from 'react'
import YouTubePlayerFactory from 'youtube-player'
import type { YouTubePlayer } from 'youtube-player/dist/types'
import { WebFrameProps } from './web-frame'
import { usePropRef } from '../../../lib/hooks/use-prop-ref'

export function YouTubeFrame({ onPlaybackStateChange, src, ...props }: WebFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<YouTubePlayer>(null)

  const onPlaybackStateChangeRef = usePropRef(onPlaybackStateChange)
  const url = useMemo(() => {
    const url = new URL(src)
    if (url.host === 'youtube.com') {
      // Events don't fire properly unless we have the www. subdomain
      url.host = 'www.youtube.com'
    }
    url.searchParams.set('enablejsapi', '1')
    url.searchParams.set('origin', window.location.origin)
    return url
  }, [src])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const player = YouTubePlayerFactory(iframe)
    playerRef.current = player

    const listener = player.on('stateChange', (event) => {
      // 1 = playing, 2 = paused, 0 = ended
      onPlaybackStateChangeRef.current?.(event.data === 1)
    })

    return () => {
      // @ts-expect-error Wrong TS types for the youtube-player library
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      player.off(listener)
      playerRef.current = null
    }
  }, [onPlaybackStateChangeRef, src])

  return <iframe ref={iframeRef} src={url.toString()} {...props} />
}
