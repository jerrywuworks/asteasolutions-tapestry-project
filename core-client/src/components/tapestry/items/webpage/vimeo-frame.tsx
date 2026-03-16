import { useEffect, useRef } from 'react'
import VimeoPlayer from '@vimeo/player'
import { WebFrameProps } from './web-frame'
import { usePropRef } from '../../../lib/hooks/use-prop-ref'

export function VimeoFrame({ onPlaybackStateChange, ...props }: WebFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<VimeoPlayer>(null)

  const onPlaybackStateChangeRef = usePropRef(onPlaybackStateChange)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const player = new VimeoPlayer(iframe)
    playerRef.current = player

    const onStart = () => onPlaybackStateChangeRef.current?.(true)
    const onStop = () => onPlaybackStateChangeRef.current?.(false)

    player.on('play', onStart)
    player.on('pause', onStop)
    player.on('ended', onStop)

    return () => {
      player.off('play', onStart)
      player.off('pause', onStop)
      player.off('ended', onStop)
      playerRef.current = null
    }
  }, [onPlaybackStateChangeRef])

  return <iframe ref={iframeRef} {...props} />
}
