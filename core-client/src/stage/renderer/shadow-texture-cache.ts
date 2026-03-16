import { DropShadowFilter } from 'pixi-filters'
import { Graphics, Renderer, Rectangle as PixiRectangle, Texture, Sprite, Container } from 'pixi.js'

export interface ShadowNineSlice {
  texture: Texture
  inset: number
}

const cache = new Map<number, ShadowNineSlice>()

export function obtainShadowNineSlice(renderer: Renderer, borderRadius: number) {
  if (cache.has(borderRadius)) {
    return cache.get(borderRadius)
  }

  const shadows = [
    // Note that CSS uses Gaussian blurs for drop shadows and Pixi uses Kawase blur filters, so blur and alpha values
    // don't translate 1-to-1 between CSS and Pixi! The values below approximately match the following CSS rule:
    //    box-shadow: 0 1px 3px rgb(0 0 0 / 15%), 0 1px 2px rgb(0 0 0 / 30%);
    new DropShadowFilter({
      color: 0x000000,
      alpha: 0.3,
      blur: 0.5,
      offset: { x: 0, y: 1 },
    }),
    new DropShadowFilter({
      color: 0x000000,
      alpha: 0.4,
      blur: 0.2,
      offset: { x: 0, y: 1 },
    }),
  ]

  shadows.forEach((shadow) => {
    shadow.padding = 8
  })

  const margin = 8 // Margin should be sufficient to fit shadow blur + offset
  const rectSize = 128 // A small area that is meant to be stretched in a 9-slice

  const graphics = new Graphics()
    .beginPath()
    .roundRect(margin + 1, margin + 1, rectSize - 2, rectSize - 2, borderRadius)
    .fill({ color: 0x000000, alpha: 1 })
  graphics.filters = shadows

  const size = rectSize + 2 * margin
  const solidTexture = renderer.generateTexture({
    target: graphics,
    frame: new PixiRectangle(0, 0, size, size),
  })

  const eraser = new Graphics()
    .roundRect(margin, margin, rectSize, rectSize, borderRadius)
    .fill({ color: 0xffffff })
  eraser.blendMode = 'erase'

  const shadowSprite = new Sprite(solidTexture)
  const container = new Container({ children: [shadowSprite, eraser] })
  const texture = renderer.generateTexture({
    target: container,
    frame: new PixiRectangle(0, 0, size, size),
  })

  const shadowNineSlice = { texture, inset: margin + borderRadius }
  cache.set(borderRadius, shadowNineSlice)

  return shadowNineSlice
}
