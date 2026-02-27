import { DetailedHTMLProps, IframeHTMLAttributes } from 'react'
import { WebpageType } from 'tapestry-core/src/data-format/schemas/item'
import { YouTubeFrame } from './youtube-frame'
import { VimeoFrame } from './vimeo-frame'

export interface WebFrameProps extends DetailedHTMLProps<
  IframeHTMLAttributes<HTMLIFrameElement>,
  HTMLIFrameElement
> {
  src: string
  onLoad: () => void
  onPlaybackStateChange?: (isPlaying: boolean) => void
}

export interface WebFrameSwitchProps extends WebFrameProps {
  webpageType?: WebpageType | null
}

export function WebFrame({ webpageType, ...props }: WebFrameSwitchProps) {
  if (webpageType === 'youtube') {
    return <YouTubeFrame {...props} />
  }

  if (webpageType === 'vimeo') {
    return <VimeoFrame {...props} />
  }

  // TODO: Handle IA audio and video frames as well, once they expose a similar API.
  return <iframe {...props} />
}
