import { Container, ContainerOptions, Graphics, NineSliceSprite, Sprite, Texture } from 'pixi.js'
import { ORIGIN, Rectangle, Size } from 'tapestry-core/src/lib/geometry'
import { ShadowNineSlice } from './shadow-texture-cache'
import { MaterialIconTextureProps, materialIconToTexture } from '../../lib/pixi'
import { isEqual } from 'lodash-es'
import { LiteralColor } from '../../theme/types'

export interface ThumbnailContainerState {
  size: Size
  thumbnailPlacement: 'center' | 'fit' | 'cover' | 'stretch'
  borderRadius: number
  dropShadow: ShadowNineSlice | null
  icon?: {
    props: MaterialIconTextureProps
    background?: LiteralColor
  }
}

interface IconTextureCacheEntry {
  props: MaterialIconTextureProps
  texture: Texture
  refCount: number
}

const iconTextureCache: IconTextureCacheEntry[] = []

function obtainIconTexture(props: MaterialIconTextureProps) {
  const cacheEntry = iconTextureCache.find((entry) => isEqual(entry.props, props))
  if (cacheEntry) {
    cacheEntry.refCount += 1
    return cacheEntry.texture
  }

  const texture = materialIconToTexture(props)
  iconTextureCache.push({ props, texture, refCount: 1 })
  return texture
}

function releaseIconTexture(texture: Texture) {
  const cacheEntryIndex = iconTextureCache.findIndex((entry) => entry.texture === texture)
  if (cacheEntryIndex >= 0) {
    const cacheEntry = iconTextureCache[cacheEntryIndex]
    cacheEntry.refCount -= 1
    if (cacheEntry.refCount === 0) {
      cacheEntry.texture.destroy(true)
      iconTextureCache.splice(cacheEntryIndex, 1)
    }
  }
}

export class ThumbnailContainer extends Container {
  private state: ThumbnailContainerState
  private shadowSprite?: NineSliceSprite
  private thumbnailContainer = new Container()
  private thumbnail?: Sprite
  private cornersMask = new Graphics()
  private iconBackground?: Graphics
  private iconSprite?: Sprite
  private renderedIconProps?: MaterialIconTextureProps
  private renderedIconBackgroundProps?: { color: LiteralColor; radius: number }

  constructor(
    texture: Texture | null,
    thumbnailOpts: Partial<ThumbnailContainerState> = {},
    containerOpts: ContainerOptions = {},
  ) {
    super(containerOpts)
    this.state = {
      size: { width: 200, height: 150 },
      thumbnailPlacement: 'cover',
      borderRadius: 8,
      dropShadow: null,
      ...thumbnailOpts,
    }

    this.addChild(this.thumbnailContainer)

    this.thumbnailContainer.addChild(this.cornersMask)
    this.thumbnailContainer.mask = this.cornersMask

    if (texture) {
      this.thumbnail = this.createSprite(texture)
      this.thumbnailContainer.addChild(this.thumbnail)
    }

    this.update()
  }

  private createSprite(texture: Texture) {
    const sprite = new Sprite(texture)
    sprite.width = this.state.size.width
    sprite.height = this.state.size.height
    return sprite
  }

  update(thumbnailOpts: Partial<ThumbnailContainerState> = {}) {
    Object.assign(this.state, thumbnailOpts)

    this.roundCorners()
    this.fitThumbnail()
    this.applyShadow()
    this.updateIconBackground()
    this.updateIconTexture()
    this.updateIconPosition()
  }

  set texture(newTexture: Texture | null) {
    if (this.thumbnail) {
      this.thumbnailContainer.removeChild(this.thumbnail)
      this.thumbnail.destroy()
      this.thumbnail = undefined
    }
    if (newTexture) {
      this.thumbnail = this.createSprite(newTexture)
      this.thumbnailContainer.addChild(this.thumbnail)
    }
    this.fitThumbnail()
  }

  private roundCorners() {
    this.cornersMask.clear()
    const { size, borderRadius } = this.state
    this.cornersMask.roundRect(0, 0, size.width, size.height, borderRadius)
    this.cornersMask.fill(0xffffff)
  }

  private fitThumbnail() {
    if (!this.thumbnail) return

    const { texture } = this.thumbnail
    const containerBounds = new Rectangle(ORIGIN, this.state.size)
    let thumbnailBounds: Rectangle
    if (this.state.thumbnailPlacement === 'center') {
      thumbnailBounds = new Rectangle(
        containerBounds.center.x - texture.width / 2,
        containerBounds.center.y - texture.height / 2,
        texture.width,
        texture.height,
      )
    } else if (this.state.thumbnailPlacement === 'fit') {
      thumbnailBounds = Rectangle.fittedInto(containerBounds, texture.width / texture.height)
    } else if (this.state.thumbnailPlacement === 'cover') {
      thumbnailBounds = Rectangle.covering(containerBounds, texture.width / texture.height)
    } else {
      thumbnailBounds = containerBounds
    }
    this.thumbnail.scale.set(
      thumbnailBounds.width / texture.width,
      thumbnailBounds.height / texture.height,
    )
    this.thumbnail.x = thumbnailBounds.left
    this.thumbnail.y = thumbnailBounds.top
  }

  private applyShadow() {
    if (this.state.dropShadow) {
      const { texture, inset } = this.state.dropShadow
      if (!this.shadowSprite) {
        this.shadowSprite = new NineSliceSprite({
          texture,
          leftWidth: inset,
          topHeight: inset,
          rightWidth: inset,
          bottomHeight: inset,
        })
        this.addChildAt(this.shadowSprite, 0)
      }
      this.shadowSprite.x = -inset + this.state.borderRadius
      this.shadowSprite.y = -inset + this.state.borderRadius
      this.shadowSprite.width = this.state.size.width + inset
      this.shadowSprite.height = this.state.size.height + inset
    } else if (this.shadowSprite) {
      this.shadowSprite.destroy()
      this.shadowSprite = undefined
    }
  }

  private updateIconBackground() {
    const { icon } = this.state
    const radius = (icon?.props.size ?? 24) / 2
    const newProps = icon?.background ? { color: icon.background, radius } : undefined
    if (isEqual(newProps, this.renderedIconBackgroundProps)) return

    this.renderedIconBackgroundProps = newProps
    if (!newProps) {
      this.iconBackground?.destroy()
      this.iconBackground = undefined
      return
    }

    if (this.iconBackground) {
      this.iconBackground.clear()
    } else {
      this.iconBackground = new Graphics({ zIndex: 1 })
      this.thumbnailContainer.addChild(this.iconBackground)
    }

    this.iconBackground.circle(radius, radius, radius).fill({ color: newProps.color, alpha: 0.5 })
  }

  private updateIconTexture() {
    if (isEqual(this.state.icon?.props, this.renderedIconProps)) return

    const props = (this.renderedIconProps = this.state.icon?.props)

    if (this.iconSprite) {
      releaseIconTexture(this.iconSprite.texture)
      this.iconSprite.destroy()
      this.iconSprite = undefined
    }

    if (!props) return

    this.iconSprite = new Sprite({ texture: obtainIconTexture(props), zIndex: 1 })
    this.thumbnailContainer.addChild(this.iconSprite)
  }

  private updateIconPosition() {
    const center = new Rectangle(ORIGIN, this.state.size).center

    if (this.iconBackground) {
      const radius = this.renderedIconBackgroundProps!.radius
      this.iconBackground.position.set(center.x - radius, center.y - radius)
    }
    if (this.iconSprite) {
      this.iconSprite.anchor = 0.5
      this.iconSprite.position = center
    }
  }
}
