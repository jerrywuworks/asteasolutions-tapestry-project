import { MultiselectMenu } from '../multiselect-menu'
import { useTapestryData } from '../../../pages/tapestry/tapestry-providers'
import { getSelectionItems } from 'tapestry-core-client/src/view-model/utils'
import { useSingleGroupSelection } from 'tapestry-core-client/src/components/lib/hooks/use-single-group-selection'
import { Multiselection as BaseMultiselection } from 'tapestry-core-client/src/components/tapestry/multiselection'
import { getMultiselectRectangle } from '../../../pages/tapestry/view-model/utils'
import { ResizeHandles } from '../resize-handles'
import { EditableGroupViewModel } from '../../../pages/tapestry/view-model'

export function Multiselection() {
  const { items, selection, interactionMode, selectionResizeState, interactiveElement } =
    useTapestryData([
      'items',
      'selection',
      'interactionMode',
      'selectionResizeState',
      'interactiveElement',
    ])
  const selectionItems = getSelectionItems({ items, selection })
  const selectionBounds = getMultiselectRectangle(selectionItems, selectionResizeState)
  const isEditMode = interactionMode === 'edit'

  const selectedGroup = useSingleGroupSelection<EditableGroupViewModel>()

  return (
    <BaseMultiselection
      bounds={selectionBounds}
      style={{ pointerEvents: isEditMode ? 'auto' : 'none' }}
      halo={<MultiselectMenu selectionBounds={selectionBounds} selectedGroup={selectedGroup} />}
    >
      {isEditMode && !interactiveElement && <ResizeHandles />}
    </BaseMultiselection>
  )
}
