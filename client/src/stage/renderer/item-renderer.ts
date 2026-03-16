import { Graphics } from 'pixi.js'
import { THEMES } from 'tapestry-core-client/src/theme/themes'
import { EditableItemViewModel, TapestryEditorStore } from '../../pages/tapestry/view-model'
import { TapestryStage } from 'tapestry-core-client/src/stage'
import {
  ItemRenderer,
  ItemRenderState,
} from 'tapestry-core-client/src/stage/renderer/item-renderer'

const DEFAULT_ITEM_Z_INDEX = 1

export const ITEM_BORDER_RADIUS = 8

export class EditorItemRenderer<T extends EditableItemViewModel> extends ItemRenderer<T> {
  private preview = new Graphics({ label: 'preview', zIndex: 0 })
  private previewBackground: string

  constructor(store: TapestryEditorStore, stage: TapestryStage, viewModel: T) {
    super(store.as('base'), stage, viewModel)

    this.pixiContainer.zIndex = DEFAULT_ITEM_Z_INDEX
    this.previewBackground = THEMES[store.get('theme')].color('background.secondaryInverse')
  }

  private drawPreview(viewModel: T) {
    const { previewBounds } = viewModel
    if (previewBounds) {
      const { left, top, width, height } = previewBounds

      this.preview
        .clear()
        .roundRect(left, top, width, height, ITEM_BORDER_RADIUS)
        .fill({ color: this.previewBackground, alpha: 0.25 })

      if (!this.preview.parent) {
        this.pixiContainer.addChild(this.preview)
      }
    } else {
      this.preview.removeFromParent()
    }
  }

  protected doRender(state: ItemRenderState<T>): void {
    super.doRender(state)
    this.drawPreview(state.viewModel)
  }
}
